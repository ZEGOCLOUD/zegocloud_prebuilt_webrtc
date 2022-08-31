/// <reference types="node" />
import React from "react";
import { ZegoDeviceInfo } from "zego-express-engine-webrtc/sdk/code/zh/ZegoExpressEntity.web";
import { ZegoSettingsProps } from "../../../model";
import { SoundMeter } from "../../../modules/soundmeter";
export declare class ZegoSettings extends React.Component<ZegoSettingsProps> {
    state: {
        visible: boolean;
        selectTab: "AUDIO" | "VIDEO";
        seletMic: string | undefined;
        seletSpeaker: string | undefined;
        seletCamera: string | undefined;
        seletVideoResolution: string | undefined;
        micDevices: ZegoDeviceInfo[];
        speakerDevices: ZegoDeviceInfo[];
        cameraDevices: ZegoDeviceInfo[];
        localVideoStream: MediaStream | undefined;
        localAudioStream: MediaStream | undefined;
        audioVolume: number;
        speakerVolume: number;
        isSpeakerPlaying: boolean;
        renderAudio: boolean;
    };
    videoRef: React.RefObject<HTMLDivElement>;
    speakerTimer: NodeJS.Timer | null;
    micTimer: NodeJS.Timer | null;
    micSounder: SoundMeter;
    speakerSounder: SoundMeter;
    solutionList: {
        name: string;
        value: string;
    }[];
    componentDidMount(): Promise<void>;
    componentWillUnmount(): void;
    getDevices(): Promise<{
        micDevices: ZegoDeviceInfo[];
        speakerDevices: ZegoDeviceInfo[];
        cameraDevices: ZegoDeviceInfo[];
        seletMic: string | undefined;
        seletSpeaker: string | undefined;
        seletCamera: string | undefined;
        seletVideoResolution: string | undefined;
    }>;
    createVideoStream(): Promise<boolean>;
    createAudioStream(): Promise<boolean>;
    toggleTab(type: string): void;
    toggleMic(deviceID: string): Promise<void>;
    toggleSpeaker(deviceID: string): Promise<void>;
    toggleCamera(deviceID: string): Promise<void>;
    toggleVideoResolution(level: string): Promise<void>;
    toggleSpeakerTest(): void;
    close(): void;
    captureMicVolume(): void;
    onTestMusicEnded(): void;
    render(): React.ReactNode;
}
export declare const ZegoSettingsAlert: (config: ZegoSettingsProps) => void;
