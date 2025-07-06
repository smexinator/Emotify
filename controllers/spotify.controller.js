const Emotion = require("../models/emotion.model");
const querystring = require("querystring");

// FIXED: Reduced to max 3 genres per emotion (Spotify has 5 total seed limit)
const emotionGenreMapping = {
  neutral: "chill,classical,acoustic", // Reduced from 5 to 3
  happy: "pop,disco,funk", // Changed alt-rock to funk (more reliable)
  sad: "blues,soul,sad", // Reduced from 5 to 3
  angry: "rock,metal,punk", // Reduced from 5 to 3
  fearful: "ambient,chill,jazz", // Added more options
  surprised: "electronic,edm,dance", // Changed electro to dance
};

// We'll dynamically fetch categories, but here are some known working ones as fallback
const emotionCategoryMapping = {
  neutral: "mood,chill,jazz,focus,classical",
  happy: "party,pop,dance,summer,workout",
  sad: "mood,blues,folk,indie,acoustic",
  angry: "rock,metal,workout,hard-rock,punk",
  fearful: "chill,ambient,jazz,classical,sleep",
  surprised: "electronic,party,dance,new-releases,discover",
};

// Function to get available categories from Spotify
async function getAvailableCategories(accessToken) {
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/browse/categories?limit=50",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const categories = data.categories?.items?.map((cat) => cat.id) || [];
      console.log("Available categories:", categories);
      return categories;
    } else {
      console.log("Failed to get categories, using fallback");
      return [];
    }
  } catch (error) {
    console.log("Error getting categories:", error);
    return [];
  }
}

exports.getRecommendedSongs = async function (req, res, next) {
  try {
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      console.error("No access token found in session");
      res.locals.tracks = [];
      await saveEmotionsData(req, res);
      return next();
    }

    const emotion = req.params.emotion;

    console.log(`Getting songs for emotion: ${emotion}`);

    // WORKAROUND: Since recommendations API is not available, use search API instead
    // This searches for tracks based on emotion-related keywords
    const emotionSearchTerms = {
      neutral: "chill acoustic calm peaceful",
      happy: "upbeat energetic dance pop party",
      sad: "melancholy blues slow ballad emotional",
      angry: "rock metal aggressive intense energy",
      fearful: "ambient dark atmospheric tension",
      surprised: "electronic unexpected dynamic energetic",
    };

    const searchTerm = emotionSearchTerms[emotion.toLowerCase()] || "music";
    const limit = 20;

    // Use search endpoint instead of recommendations
    const URL = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      searchTerm
    )}&type=track&limit=${limit}&market=US`;

    console.log("Using search API as workaround:", URL);

    const response = await fetch(URL, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
    });

    console.log("Search response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Spotify Search API error: ${response.status} ${response.statusText}`
      );
      console.error("Error details:", errorText);

      res.locals.tracks = [];
      await saveEmotionsData(req, res);
      return next();
    }

    const data = await response.json();

    // Extract tracks from search results and format them like recommendations
    const tracks = data.tracks?.items || [];

    // Shuffle the results to make them feel more like recommendations
    for (let i = tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
    }

    res.locals.tracks = tracks;
    console.log(
      `Successfully fetched ${tracks.length} tracks for emotion: ${emotion} using search workaround`
    );

    await saveEmotionsData(req, res);
    next();
  } catch (error) {
    console.error("Error in getRecommendedSongs:", error);
    res.locals.tracks = [];
    await saveEmotionsData(req, res);
    next();
  }
};

exports.getRecommendedPlaylists = async function (req, res, next) {
  try {
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      console.error("No access token found in session");
      res.locals.data = [];
      await saveEmotionsData(req, res);
      return next();
    }

    const emotion = req.params.emotion;

    console.log(`Getting playlists for emotion: ${emotion}`);

    // WORKAROUND: Since browse categories API is restricted, use search API instead
    // Search for playlists based on emotion-related keywords
    const emotionPlaylistTerms = {
      neutral: "chill relaxing peaceful calm ambient",
      happy: "happy upbeat party dance pop energetic",
      sad: "sad melancholy blues emotional slow",
      angry: "angry rock metal aggressive intense",
      fearful: "dark ambient atmospheric tension scary",
      surprised: "electronic unexpected dynamic energetic",
    };

    const searchTerm = emotionPlaylistTerms[emotion.toLowerCase()] || "music";
    const limit = 10;

    // Use search endpoint for playlists instead of browse categories
    const URL = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      searchTerm
    )}&type=playlist&limit=${limit}&market=US`;

    console.log("Using search API for playlists:", URL);

    const response = await fetch(URL, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
    });

    console.log("Playlist search response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Spotify Playlist Search API error: ${response.status} ${response.statusText}`
      );
      console.error("Error details:", errorText);

      res.locals.data = [];
      await saveEmotionsData(req, res);
      return next();
    }

    const data = await response.json();

    // Debug: Log the structure of playlist data
    console.log(
      "Raw playlist data sample:",
      JSON.stringify(data.playlists?.items?.[0], null, 2)
    );

    // Extract playlists from search results
    let playlists = data.playlists?.items || [];
    console.log(`Found ${playlists.length} playlists before filtering`);

    // Filter out playlists with very few tracks (less than 10) and handle null tracks
    playlists = playlists.filter((playlist) => {
      if (!playlist) {
        console.log("Skipping null playlist");
        return false;
      }
      if (!playlist.tracks) {
        console.log(`Skipping playlist "${playlist.name}" - no tracks object`);
        return false;
      }
      if (!playlist.tracks.total || playlist.tracks.total < 10) {
        console.log(
          `Skipping playlist "${playlist.name}" - only ${playlist.tracks.total} tracks`
        );
        return false;
      }
      return true;
    });

    console.log(`${playlists.length} playlists after filtering`);

    // Shuffle the results to make them feel more varied
    for (let i = playlists.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playlists[i], playlists[j]] = [playlists[j], playlists[i]];
    }

    // Limit to requested number
    playlists = playlists.slice(0, limit);

    res.locals.data = playlists;
    console.log(
      `Successfully fetched ${playlists.length} playlists for emotion: ${emotion} using search workaround`
    );

    await saveEmotionsData(req, res);
    next();
  } catch (error) {
    console.error("Error in getRecommendedPlaylists:", error);
    res.locals.data = [];
    await saveEmotionsData(req, res);
    next();
  }
};

exports.getSongsFromMyPlaylists = async function (req, res, next) {
  try {
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      console.error("No access token found");
      res.locals.myTracks = [];
      return next();
    }

    const emotion = req.params.emotion;
    console.log(`Getting user playlists for emotion: ${emotion}`);

    // Get user playlists first
    const playlists = await getUserPlaylists(accessToken);

    if (!playlists || playlists.length === 0) {
      console.log("No user playlists found");
      res.locals.myTracks = [];
      return next();
    }

    console.log(`Found ${playlists.length} user playlists`);

    // Get tracks from the first playlist
    const tracks = await getPlaylistTracks(playlists[0].id, accessToken);
    res.locals.myTracks = tracks || [];

    console.log(`Found ${(tracks || []).length} tracks in first playlist`);

    next();
  } catch (error) {
    console.error("Error in getSongsFromMyPlaylists:", error);
    res.locals.myTracks = [];
    next();
  }
};

// Function to get followed users from Spotify API
exports.getFollowedUsers = async function (req, res, next) {
  try {
    const accessToken = req.session.accessToken;
    const limit = req.query.limit || 10;

    if (!accessToken) {
      console.error("No access token found");
      res.locals.artists = [];
      return next();
    }

    const response = await fetch(
      `https://api.spotify.com/v1/me/following?type=artist&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to get followed artists:", response.status);
      res.locals.artists = [];
      return next();
    }

    const data = await response.json();
    res.locals.artists = data.artists ? data.artists.items : [];

    next();
  } catch (error) {
    console.error("Error in getFollowedUsers:", error);
    res.locals.artists = [];
    next();
  }
};

exports.getMyTopTracks = async function (req, res, next) {
  try {
    const accessToken = req.session.accessToken;
    const limit = req.query.limit || 10;

    if (!accessToken) {
      console.error("No access token found");
      res.locals.top_tracks = [];
      return next();
    }

    const response = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to get top tracks:", response.status);
      res.locals.top_tracks = [];
      return next();
    }

    const data = await response.json();
    res.locals.top_tracks = data.items || [];

    next();
  } catch (error) {
    console.error("Error in getMyTopTracks:", error);
    res.locals.top_tracks = [];
    next();
  }
};

async function getUserPlaylists(accessToken) {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/playlists", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to get user playlists:", response.status);
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error in getUserPlaylists:", error);
    return [];
  }
}

async function getPlaylistTracks(playlistId, accessToken) {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to get playlist tracks:", response.status);
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error in getPlaylistTracks:", error);
    return [];
  }
}

async function saveEmotionsData(req, res) {
  try {
    const filter = { emotion: req.params.emotion };
    const update = { emotion: req.params.emotion, $inc: { frequency: 1 } };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    await Emotion.findOneAndUpdate(filter, update, options);
  } catch (error) {
    console.error("Error saving emotions data:", error);
  }
}

// Export test function to get available categories
exports.getAvailableCategoriesTest = async function (req, res, next) {
  try {
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      return res.json({ error: "No access token found" });
    }

    console.log("Fetching available Spotify categories...");
    const categories = await getAvailableCategories(accessToken);

    if (categories.length > 0) {
      res.json({
        success: true,
        totalCategories: categories.length,
        categories: categories,
        message: "These are the valid category IDs you can use",
      });
    } else {
      res.json({
        success: false,
        message: "Could not fetch categories or no categories available",
      });
    }
  } catch (error) {
    res.json({
      error: "Failed to get categories",
      details: error.message,
    });
  }
};
exports.testSpotifyConnection = async function (req, res, next) {
  try {
    const accessToken = req.session.accessToken;

    console.log("=== SPOTIFY CONNECTION TEST ===");
    console.log("Access token exists:", !!accessToken);
    console.log("Access token length:", accessToken ? accessToken.length : 0);
    console.log(
      "Access token preview:",
      accessToken ? accessToken.substring(0, 20) + "..." : "none"
    );

    if (!accessToken) {
      return res.json({
        error: "No access token found in session",
        session: Object.keys(req.session),
        tokenExists: false,
      });
    }

    // Test user profile with detailed error handling
    console.log("Testing Spotify /me endpoint...");
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
    });

    console.log("Profile response status:", profileResponse.status);
    console.log(
      "Profile response headers:",
      profileResponse.headers.get("content-type")
    );

    let profileResult = {};
    if (profileResponse.ok) {
      const profileText = await profileResponse.text();
      console.log("Profile response text length:", profileText.length);

      if (profileText) {
        try {
          profileResult = JSON.parse(profileText);
          console.log(
            "Profile parsed successfully, user:",
            profileResult.display_name
          );
        } catch (parseError) {
          console.log("Profile JSON parse error:", parseError);
          profileResult = {
            error: "Failed to parse profile JSON",
            raw: profileText.substring(0, 200),
          };
        }
      } else {
        profileResult = { error: "Empty profile response" };
      }
    } else {
      const errorText = await profileResponse.text();
      console.log("Profile error response:", errorText);
      profileResult = {
        error: `Profile API failed: ${profileResponse.status}`,
        details: errorText,
      };
    }

    // Test search API (this should work in development mode)
    console.log("Testing Spotify search endpoint...");
    let searchResult = {};
    try {
      const searchResponse = await fetch(
        "https://api.spotify.com/v1/search?q=test&type=track&limit=1",
        {
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Search response status:", searchResponse.status);

      if (searchResponse.ok) {
        const searchText = await searchResponse.text();
        if (searchText) {
          try {
            const searchData = JSON.parse(searchText);
            searchResult = {
              success: true,
              tracksFound: searchData.tracks
                ? searchData.tracks.items.length
                : 0,
            };
          } catch (parseError) {
            searchResult = { error: "Failed to parse search JSON" };
          }
        } else {
          searchResult = { error: "Empty search response" };
        }
      } else {
        const errorText = await searchResponse.text();
        searchResult = {
          error: `Search API failed: ${searchResponse.status}`,
          details: errorText,
        };
      }
    } catch (searchError) {
      searchResult = {
        error: "Network error requesting search",
        details: searchError.message,
      };
    }

    // Test available genres (this might fail in development mode)
    console.log("Testing Spotify genres endpoint...");
    let genresResult = {};
    try {
      const genresResponse = await fetch(
        "https://api.spotify.com/v1/recommendations/available-genre-seeds",
        {
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Genres response status:", genresResponse.status);

      if (genresResponse.ok) {
        const genresText = await genresResponse.text();
        console.log("Genres response text length:", genresText.length);

        if (genresText) {
          try {
            const genresData = JSON.parse(genresText);
            genresResult = {
              success: true,
              totalGenres: genresData.genres ? genresData.genres.length : 0,
              sampleGenres: genresData.genres
                ? genresData.genres.slice(0, 10)
                : [],
            };
            console.log(
              "Genres parsed successfully, count:",
              genresResult.totalGenres
            );
          } catch (parseError) {
            console.log("Genres JSON parse error:", parseError);
            genresResult = {
              error: "Failed to parse genres JSON",
              raw: genresText.substring(0, 200),
            };
          }
        } else {
          genresResult = { error: "Empty genres response" };
        }
      } else {
        const errorText = await genresResponse.text();
        console.log("Genres error response:", errorText);
        genresResult = {
          error: `Genres API failed: ${genresResponse.status}`,
          details: errorText,
          note: "This is expected in Development Mode - recommendations API requires Extended Quota Mode",
        };
      }
    } catch (genresError) {
      console.log("Genres request failed:", genresError);
      genresResult = {
        error: "Network error requesting genres",
        details: genresError.message,
      };
    }

    // Test a simple recommendation request (might fail in development mode)
    console.log("Testing simple recommendation...");
    let recResult = {};
    try {
      const recResponse = await fetch(
        "https://api.spotify.com/v1/recommendations?limit=1&seed_genres=pop",
        {
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Recommendation response status:", recResponse.status);

      if (recResponse.ok) {
        const recText = await recResponse.text();
        if (recText) {
          try {
            const recData = JSON.parse(recText);
            recResult = {
              success: true,
              tracksFound: recData.tracks ? recData.tracks.length : 0,
            };
          } catch (parseError) {
            recResult = { error: "Failed to parse recommendation JSON" };
          }
        } else {
          recResult = { error: "Empty recommendation response" };
        }
      } else {
        const errorText = await recResponse.text();
        recResult = {
          error: `Recommendation API failed: ${recResponse.status}`,
          details: errorText,
          note: "This is expected in Development Mode - recommendations API requires Extended Quota Mode",
        };
      }
    } catch (recError) {
      recResult = {
        error: "Network error requesting recommendations",
        details: recError.message,
      };
    }

    const finalResult = {
      timestamp: new Date().toISOString(),
      appModeDetection: {
        profileWorks: !!profileResult.display_name,
        searchWorks: !!searchResult.success,
        recommendationsWork: !!recResult.success,
        likelyMode:
          !!profileResult.display_name &&
          !!searchResult.success &&
          !recResult.success
            ? "Development Mode (Limited API Access)"
            : "Unknown",
      },
      tokenInfo: {
        exists: !!accessToken,
        length: accessToken ? accessToken.length : 0,
        preview: accessToken ? accessToken.substring(0, 20) + "..." : "none",
      },
      profile: profileResult,
      search: searchResult,
      genres: genresResult,
      recommendation: recResult,
      suggestions:
        profileResult.display_name && !recResult.success
          ? [
              "Your app appears to be in Development Mode",
              "Recommendations API requires Extended Quota Mode",
              "The current implementation uses Search API as a workaround",
              "To get Extended Mode: Apply at https://developer.spotify.com/documentation/web-api/concepts/quota-modes",
            ]
          : [],
    };

    console.log("=== TEST COMPLETE ===");
    res.json(finalResult);
  } catch (error) {
    console.error("Test function error:", error);
    res.json({
      error: "Test function crashed",
      details: error.message,
      stack: error.stack.split("\n").slice(0, 5),
    });
  }
};
