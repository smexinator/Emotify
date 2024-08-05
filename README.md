# Music Recommendation through Facial Emotions

## Overview

Emotion recognition combined with music recommendation systems offers a fantastic way to enhance the digital era user experience. This project explores a novel approach where personalized music recommendations, depending on users’ current mood, are guided by facial expression detection.

## Project Motivation

This project aims to enhance the user experience of digital music services by providing personalized music recommendations based on the user's current emotional state.

## Project Vision, Scope, and Glossary

### Project Vision
To create a cutting-edge music recommendation system that enhances user experience by leveraging real-time facial emotion detection.

### Project Scope
This project focuses on developing a robust system that detects user emotions through facial expressions and recommends songs or playlists accordingly using the Spotify API.

### Glossary
- **Facial Emotion Detection**: Identifying human emotions through facial expressions using machine learning models.
- **Music Recommendation System**: A system that suggests music tracks or playlists based on user preferences and emotional state.
- **Spotify API**: An API provided by Spotify to access its music catalog and user data.

## Objectives

1. Develop a reliable facial emotion detection system.
2. Integrate the emotion detection system with Spotify's API to fetch personalized music recommendations.
3. Ensure a seamless and user-friendly interface for the application.

## Tools

- **Frontend**: HTML, CSS
- **Backend**: Node.js
- **Emotion Detection**: Face-API.js, MTCNN (Multi-task Cascaded Convolutional Networks)
- **Music Recommendation**: Spotify API

## System Requirements, Architecture, and Design

### Functional Requirements
1. User Authentication: Sign Up and Sign In functionality.
2. Facial Emotion Detection: Real-time emotion detection using the user's webcam.
3. Music Recommendation: Provide song and playlist recommendations based on detected emotions.

### Non-Functional Requirements
1. Performance: The system should perform reliably and efficiently.
2. Usability: The interface should be user-friendly and intuitive.

## Installation Guide

### Prerequisites

1. **Node.js**: Ensure you have Node.js installed. You can download it from [Node.js Official Website](https://nodejs.org/).
2. **Spotify Developer Account**: Create a Spotify Developer account and obtain the necessary API keys from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).

### Steps to Install and Run the Project

1. **Clone the repository**

   git clone https://github.com/yourusername/Music-Recommendation-Facial-Emotions.git
   
   cd Music-Recommendation-Facial-Emotions


2 **Install Dependencies**

Run the following command to install the required dependencies:

npm install


3 **Setup Environment Variables**

Create a .env file in the root directory and add your Spotify API credentials:

SPOTIFY_CLIENT_ID=your_spotify_client_id

SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

4 **Start the Application**

Run the following command to start the application:

npm start


