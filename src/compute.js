let Compute = require("@google-cloud/compute");

const compute = new Compute();
const zone = compute.zone("us-west1");
const vmName = "derivative-instance-1";
const [vm, operation] = await zone.createVM(vmName);
await operation;
log(`VM STARTED`);

export default Compute;
