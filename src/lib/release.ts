import metadata from "../../package.json";

export const RELEASE_VERSION = metadata.version;
export const RELEASE_LABEL = `V${RELEASE_VERSION.split(".").slice(0, 2).join(".")}`;
