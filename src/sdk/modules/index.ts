import { getConfig } from "./util";
import { randomID } from "../../util";
import { ZegoExpressEngine } from "zego-express-engine-webrtc";
import {
  ZegoDeviceInfo,
  ZegoLocalStreamConfig,
  ZegoPlayerState,
  ZegoPublisherState,
  ZegoPublishStats,
  ZegoPublishStreamConfig,
  ZegoServerResponse,
  ZegoStreamList,
} from "zego-express-engine-webrtc/sdk/code/zh/ZegoExpressEntity.web";
import {
  ZegoUser,
  ZegoBroadcastMessageInfo,
} from "zego-express-engine-webrtm/sdk/code/zh/ZegoExpressEntity.d";
import { ZegoCloudRemoteMedia, ZegoCloudRoomConfig } from "../model";
import { SoundMeter } from "./soundmeter";

export class ZegoCloudRTCCore {
  static _instance: ZegoCloudRTCCore;
  static _zg: ZegoExpressEngine;
  _expressConfig!: {
    appID: number;
    userID: string;
    userName: string;
    roomID: string;
    token: string;
  };
  //   static _soundMeter: SoundMeter;
  static getInstance(token: string): ZegoCloudRTCCore {
    const config = getConfig(token);
    if (!ZegoCloudRTCCore._instance && config) {
      ZegoCloudRTCCore._instance = new ZegoCloudRTCCore();
      ZegoCloudRTCCore._instance._expressConfig = config;
      //   ZegoCloudRTCCore._soundMeter = new SoundMeter();
      ZegoCloudRTCCore._zg = new ZegoExpressEngine(
        ZegoCloudRTCCore._instance._expressConfig.appID,
        "wss://webliveroom" +
          ZegoCloudRTCCore._instance._expressConfig.appID +
          "-api.zegocloud.com/ws"
      );
    }

    return ZegoCloudRTCCore._instance;
  }

  status: {
    loginRsp: boolean;
    videoRefuse: boolean;
    audioRefuse: boolean;
    micDeviceID?: string;
    cameraDeviceID?: string;
    speakerDeviceID?: string;
    videoResolution?: string;
  } = {
    loginRsp: false,
    videoRefuse: false,
    audioRefuse: false,
  };
  remoteStreamMap: { [index: string]: ZegoCloudRemoteMedia } = {};

  async checkWebRTC(): Promise<boolean> {
    const result = await ZegoCloudRTCCore._zg.checkSystemRequirements("webRTC");
    return !!result.result;
  }

  _config: ZegoCloudRoomConfig = {
    // @ts-ignore
    container: undefined, // 挂载容器
    preJoinViewConfig: {
      title: "Join Room", // 标题设置，默认join Room
      invitationLink: window.location.href, // 邀请链接，空则不显示，默认空
    },
    showPreJoinView: true, // 是否显示预览检测页面，默认显示
    turnOnMicrophoneWhenJoining: true, // 是否开启自己的麦克风,默认开启
    turnOnCameraWhenJoining: true, // 是否开启自己的摄像头 ,默认开启
    showMyCameraToggleButton: true, // 是否可以控制自己的麦克风,默认开启
    showMyMicrophoneToggleButton: true, // 是否可以控制体自己的摄像头,默认开启
    showAudioVideoSettingsButton: true,
    showTextChat: true, // 是否开启聊天，默认开启   preJoinViewConfig: boolean，// 通话前检测页面是否需要，默认需要
    showUserList: true, //是否显示成员列表，默认展示
    lowerLeftNotification: {
      showUserJoinAndLeave: true, //是否显示成员进出，默认显示
      showTextChat: true, // 是否显示未读消息，默认显示
    },
    leaveRoomCallback: () => {}, // 退出房间回调
    joinRoomCallback: () => {}, // 进房回调
    roomTimerDisplayed: false, //是否计时，默认不计时
    branding: {
      logoURL: "",
    },
    showLeavingView: true, // 离开房间后页面，默认有
    localizationJSON: {}, //者json对象
  };
  setConfig(config: ZegoCloudRoomConfig) {
    this._config = { ...this._config, ...config };
  }

  getCameras(): Promise<ZegoDeviceInfo[]> {
    return ZegoCloudRTCCore._zg.getCameras();
  }
  getMicrophones(): Promise<ZegoDeviceInfo[]> {
    return ZegoCloudRTCCore._zg.getMicrophones();
  }
  getSpeakers(): Promise<ZegoDeviceInfo[]> {
    return ZegoCloudRTCCore._zg.getSpeakers();
  }

  //   capturedSoundLevelUpdate(
  //     source: MediaStream | HTMLMediaElement,
  //     sourceId: string,
  //     type: "Element" | "Stream",
  //     callback: (soundLevel: number) => void
  //   ): void {
  //     // ZegoCloudRTCCore._soundMeter.connectToSource(
  //     //   source,
  //     //   sourceId,
  //     //   type,
  //     //   callback
  //     // );
  //   }

  //   stopCapturedSoundLevelUpdate(sourceId: string): void {
  //     // ZegoCloudRTCCore._soundMeter.stop(sourceId);
  //   }

  setVolume(media: HTMLVideoElement, volume: number): void {
    media.volume = volume;
  }

  async createStream(source?: ZegoLocalStreamConfig): Promise<MediaStream> {
    return ZegoCloudRTCCore._zg.createStream(source);
  }

  async setVideoConfig(
    media: MediaStream,
    constraints: ZegoPublishStreamConfig
  ) {
    return ZegoCloudRTCCore._zg.setVideoConfig(media, constraints);
  }

  destroyStream(stream: MediaStream): void {
    ZegoCloudRTCCore._zg.destroyStream(stream);
  }

  useCameraDevice(
    media: MediaStream,
    deviceID: string
  ): Promise<ZegoServerResponse> {
    return ZegoCloudRTCCore._zg.useVideoDevice(media, deviceID);
  }

  useMicrophoneDevice(
    media: MediaStream,
    deviceID: string
  ): Promise<ZegoServerResponse> {
    return ZegoCloudRTCCore._zg.useAudioDevice(media, deviceID);
  }

  async useSpeakerDevice(
    media: HTMLMediaElement,
    deviceID: string
  ): Promise<ZegoServerResponse> {
    if (!media.srcObject) {
      return Promise.resolve({ errorCode: -1 });
    }

    try {
      const res = await ZegoCloudRTCCore._zg.useAudioOutputDevice(
        media,
        deviceID
      );
      return { errorCode: res ? 0 : -1 };
    } catch (error) {
      return { errorCode: -1 };
    }
  }

  async enableVideoCaptureDevice(
    localStream: MediaStream,
    enable: boolean
  ): Promise<boolean> {
    return ZegoCloudRTCCore._zg.enableVideoCaptureDevice(localStream, enable);
  }

  async mutePublishStreamVideo(
    localStream: MediaStream,
    enable: boolean
  ): Promise<boolean> {
    return ZegoCloudRTCCore._zg.mutePublishStreamVideo(localStream, enable);
  }
  async mutePublishStreamAudio(
    localStream: MediaStream,
    enable: boolean
  ): Promise<boolean> {
    return ZegoCloudRTCCore._zg.mutePublishStreamAudio(localStream, enable);
  }
  async muteMicrophone(enable: boolean): Promise<boolean> {
    return ZegoCloudRTCCore._zg.muteMicrophone(enable);
  }

  async enterRoom(): Promise<number> {
    // 已经登陆过不再登录
    if (this.status.loginRsp) return Promise.resolve(0);
    ZegoCloudRTCCore._zg.off("roomStreamUpdate");
    ZegoCloudRTCCore._zg.off("remoteCameraStatusUpdate");
    ZegoCloudRTCCore._zg.off("remoteMicStatusUpdate");
    ZegoCloudRTCCore._zg.off("playerStateUpdate");
    ZegoCloudRTCCore._zg.off("roomUserUpdate");
    ZegoCloudRTCCore._zg.off("IMRecvBroadcastMessage");
    ZegoCloudRTCCore._zg.off("roomStateUpdate");
    ZegoCloudRTCCore._zg.off("publisherStateUpdate");
    ZegoCloudRTCCore._zg.off("publishQualityUpdate");

    ZegoCloudRTCCore._zg.on(
      "roomStreamUpdate",
      async (
        roomID: string,
        updateType: "DELETE" | "ADD",
        streamList: ZegoStreamList[],
        extendedData?: string
      ) => {
        if (updateType === "ADD") {
          const _streamList = [];
          for (let i = 0; i < streamList.length; i++) {
            const streamInfo = streamList[i];
            try {
              const stream = await ZegoCloudRTCCore._zg.startPlayingStream(
                streamInfo.streamID
              );
              this.remoteStreamMap[streamInfo.streamID] = {
                fromUser: streamInfo.user,
                media: stream,
                micStatus: stream.getAudioTracks().length > 0 ? "OPEN" : "MUTE",
                cameraStatus:
                  stream.getVideoTracks().length > 0 ? "OPEN" : "MUTE",
                state: "PLAYING",
              };
              _streamList.push(this.remoteStreamMap[streamInfo.streamID]);
            } catch (error) {
              console.warn("【ZEGOCLOUD】:startPlayingStream error", error);
            }
          }
          this.onRemoteMediaUpdateCallBack &&
            this.onRemoteMediaUpdateCallBack("ADD", _streamList);
        } else {
          const _streamList = [];
          for (let i = 0; i < streamList.length; i++) {
            const streamInfo = streamList[i];
            _streamList.push(this.remoteStreamMap[streamInfo.streamID]);
            ZegoCloudRTCCore._zg.stopPlayingStream(streamInfo.streamID);
            delete this.remoteStreamMap[streamInfo.streamID];
            this.onRemoteMediaUpdateCallBack &&
              this.onRemoteMediaUpdateCallBack("DELETE", _streamList);
          }
        }
      }
    );
    ZegoCloudRTCCore._zg.on(
      "remoteCameraStatusUpdate",
      (streamID: string, status: "OPEN" | "MUTE") => {
        if (this.remoteStreamMap[streamID]) {
          this.remoteStreamMap[streamID].cameraStatus = status;
          this.onRemoteMediaUpdateCallBack &&
            this.onRemoteMediaUpdateCallBack("UPDATE", [
              this.remoteStreamMap[streamID],
            ]);
        }
      }
    );
    ZegoCloudRTCCore._zg.on(
      "remoteMicStatusUpdate",
      (streamID: string, status: "OPEN" | "MUTE") => {
        if (this.remoteStreamMap[streamID]) {
          this.remoteStreamMap[streamID].micStatus = status;
          this.onRemoteMediaUpdateCallBack &&
            this.onRemoteMediaUpdateCallBack("UPDATE", [
              this.remoteStreamMap[streamID],
            ]);
        }
      }
    );
    ZegoCloudRTCCore._zg.on(
      "playerStateUpdate",
      (streamInfo: ZegoPlayerState) => {
        console.warn("【ZEGOCLOUD】", streamInfo);
        if (this.remoteStreamMap[streamInfo.streamID]) {
          this.remoteStreamMap[streamInfo.streamID].state = streamInfo.state;
          this.onRemoteMediaUpdateCallBack &&
            this.onRemoteMediaUpdateCallBack("UPDATE", [
              this.remoteStreamMap[streamInfo.streamID],
            ]);
        }
      }
    );
    ZegoCloudRTCCore._zg.on(
      "roomUserUpdate",
      (roomID: string, updateType: "DELETE" | "ADD", userList: ZegoUser[]) => {
        this.onRemoteUserUpdateCallBack &&
          this.onRemoteUserUpdateCallBack(roomID, updateType, userList);
      }
    );
    ZegoCloudRTCCore._zg.on(
      "IMRecvBroadcastMessage",
      (roomID: string, chatData: ZegoBroadcastMessageInfo[]) => {
        this.onRoomMessageUpdateCallBack &&
          this.onRoomMessageUpdateCallBack(roomID, chatData);
      }
    );

    ZegoCloudRTCCore._zg.on(
      "publisherStateUpdate",
      (streamInfo: ZegoPublisherState) => {
        let state: "DISCONNECTED" | "CONNECTING" | "CONNECTED" = "DISCONNECTED";
        if (streamInfo.state === "PUBLISHING") {
          state = "CONNECTED";
        } else if (streamInfo.state === "NO_PUBLISH") {
          state = "DISCONNECTED";
        } else if (streamInfo.state === "PUBLISH_REQUESTING") {
          state = "CONNECTING";
        }
        this.onNetworkStatusCallBack &&
          this.onNetworkStatusCallBack(
            ZegoCloudRTCCore._instance._expressConfig.roomID,
            "STREAM",
            state
          );
      }
    );

    ZegoCloudRTCCore._zg.on(
      "playQualityUpdate",
      (streamID: string, stats: ZegoPublishStats) => {
        this.onNetworkStatusQualityCallBack &&
          this.onNetworkStatusQualityCallBack(
            streamID,
            Math.max(stats.video.videoQuality, stats.audio.audioQuality)
          );
      }
    );

    ZegoCloudRTCCore._zg.on(
      "publishQualityUpdate",
      (streamID: string, stats: ZegoPublishStats) => {
        this.onNetworkStatusQualityCallBack &&
          this.onNetworkStatusQualityCallBack(
            streamID,
            Math.max(stats.video.videoQuality, stats.audio.audioQuality)
          );
      }
    );

    const resp = await new Promise<number>(async (res, rej) => {
      let code: number;
      ZegoCloudRTCCore._zg.on(
        "roomStateUpdate",
        (
          roomID: string,
          state: "DISCONNECTED" | "CONNECTING" | "CONNECTED",
          errorCode: number,
          extendedData: string
        ) => {
          this.onNetworkStatusCallBack &&
            this.onNetworkStatusCallBack(roomID, "ROOM", state);
          if (state === "CONNECTED" || state === "DISCONNECTED") {
            this.status.loginRsp = errorCode === 0;
            res(errorCode);
          }
        }
      );

      await ZegoCloudRTCCore._zg.loginRoom(
        ZegoCloudRTCCore._instance._expressConfig.roomID,
        ZegoCloudRTCCore._instance._expressConfig.token,
        {
          userID: ZegoCloudRTCCore._instance._expressConfig.userID,
          userName: ZegoCloudRTCCore._instance._expressConfig.userName,
        },
        {
          userUpdate: true,
          maxMemberCount: 2,
        }
      );
    });
    return resp;
  }

  publishLocalStream(media: MediaStream): boolean {
    if (!media) return false;
    return ZegoCloudRTCCore._zg.startPublishingStream(
      this._expressConfig.userID + "_" + randomID(3),
      media
    );
  }

  async replaceTrack(
    media: MediaStream,
    mediaStreamTrack: MediaStreamTrack
  ): Promise<ZegoServerResponse> {
    return ZegoCloudRTCCore._zg.replaceTrack(media, mediaStreamTrack);
  }
  private onRemoteMediaUpdateCallBack!: (
    updateType: "DELETE" | "ADD" | "UPDATE",
    streamList: ZegoCloudRemoteMedia[]
  ) => void;

  onRemoteMediaUpdate(
    func: (
      updateType: "DELETE" | "ADD" | "UPDATE",
      streamList: ZegoCloudRemoteMedia[]
    ) => void
  ) {
    this.onRemoteMediaUpdateCallBack = func;
  }

  private onNetworkStatusQualityCallBack!: (
    roomID: string,
    level: number
  ) => void;
  onNetworkStatusQuality(func: (roomID: string, level: number) => void) {
    this.onNetworkStatusQualityCallBack = func;
  }

  private onRemoteUserUpdateCallBack!: (
    roomID: string,
    updateType: "DELETE" | "ADD",
    user: ZegoUser[]
  ) => void;
  onRemoteUserUpdate(
    func: (
      roomID: string,
      updateType: "DELETE" | "ADD",
      user: ZegoUser[]
    ) => void
  ) {
    this.onRemoteUserUpdateCallBack = func;
  }

  sendRoomMessage(message: string) {
    return ZegoCloudRTCCore._zg.sendBroadcastMessage(
      ZegoCloudRTCCore._instance._expressConfig.roomID,
      message
    );
  }
  private onRoomMessageUpdateCallBack!: (
    roomID: string,
    info: ZegoBroadcastMessageInfo[]
  ) => void;
  onRoomMessageUpdate(
    func: (roomID: string, info: ZegoBroadcastMessageInfo[]) => void
  ) {
    this.onRoomMessageUpdateCallBack = func;
  }

  NetworkStatusTimer: NodeJS.Timer | null = null;
  private onNetworkStatusCallBack!: (
    roomID: string,
    type: "ROOM" | "STREAM",
    status: "DISCONNECTED" | "CONNECTING" | "CONNECTED"
  ) => void;
  onNetworkStatus(
    func: (
      roomID: string,
      type: "ROOM" | "STREAM",
      status: "DISCONNECTED" | "CONNECTING" | "CONNECTED"
    ) => void
  ) {
    this.onNetworkStatusCallBack = (
      roomID: string,
      type: "ROOM" | "STREAM",
      status: "DISCONNECTED" | "CONNECTING" | "CONNECTED"
    ) => {
      if (status === "CONNECTING") {
        !this.NetworkStatusTimer &&
          (this.NetworkStatusTimer = setTimeout(() => {
            func(roomID, type, "DISCONNECTED");
          }, 60000));
      } else {
        if (this.NetworkStatusTimer) {
          clearTimeout(this.NetworkStatusTimer);
          this.NetworkStatusTimer = null;
        }
      }
      func(roomID, type, status);
    };
  }

  leaveRoom(): void {
    if (!this.status.loginRsp) return;
    ZegoCloudRTCCore._zg.off("roomStreamUpdate");
    ZegoCloudRTCCore._zg.off("remoteCameraStatusUpdate");
    ZegoCloudRTCCore._zg.off("remoteMicStatusUpdate");
    ZegoCloudRTCCore._zg.off("playerStateUpdate");
    ZegoCloudRTCCore._zg.off("roomUserUpdate");
    ZegoCloudRTCCore._zg.off("IMRecvBroadcastMessage");
    ZegoCloudRTCCore._zg.off("roomStateUpdate");
    ZegoCloudRTCCore._zg.off("publisherStateUpdate");
    ZegoCloudRTCCore._zg.off("publishQualityUpdate");
    this.onNetworkStatusCallBack = () => {};
    this.onRemoteMediaUpdateCallBack = () => {};
    this.onRemoteUserUpdateCallBack = () => {};
    this.onRoomMessageUpdateCallBack = () => {};
    for (let key in this.remoteStreamMap) {
      ZegoCloudRTCCore._zg.stopPlayingStream(key);
    }
    this.remoteStreamMap = {};

    ZegoCloudRTCCore._zg.logoutRoom();
    this.status.loginRsp = false;
  }
}
