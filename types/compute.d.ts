declare module "@google-cloud/compute" {
    export default class Compute {
        constructor();

        zone(name: string): Zone;
    }

    class VirtualMachine {}

    type Operation = Promise<void>;

    class Response {}

    class Zone {
        createVM(name: string): Promise<[VirtualMachine, Operation, Response]>;
    }
}
