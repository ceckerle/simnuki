import {Keyturner} from "./Keyturner";

(async () => {
    console.log("start");
    const keyturner = new Keyturner();
    const shutdownHandler = async () => {
        try {
            console.log("stop");
            await keyturner.destroy();
            console.log("stop done");
        } catch (e) {
            console.log("error during stop", e);
        }
        process.exit(0);
    };
    process.on("SIGTERM", shutdownHandler);
    process.on("SIGINT", shutdownHandler);
    await keyturner.init();
    console.log("start done");
})().catch((e) => {
    console.log("error during start", e);
    process.exit(1);
});
