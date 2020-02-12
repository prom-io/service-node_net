import {DdsFileMetadata} from "./DdsFileMetadata";

export interface DdsFileInfo {
    name: string,
    price: number,
    duration: number,
    additional: DdsFileMetadata
}
