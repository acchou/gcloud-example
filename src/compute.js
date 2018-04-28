import Compute from "@google-cloud/compute";

const compute = new Compute();
compute.createFirewall("hello");
compute.createHealthCheck("");

export default Compute;
