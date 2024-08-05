import type { InstanceOptions } from 'flowbite';

const instanceOptions: InstanceOptions = {
    id: "my-unique-id",
    override: true,
};

const modal = new Modal($targetEl, options, instanceOptions);