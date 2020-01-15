import {DdsFileMetadata} from "../DdsFileMetadata";

export interface ExtendStorageDurationRequest {
    duration: number,
    additional?: DdsFileMetadata
}
