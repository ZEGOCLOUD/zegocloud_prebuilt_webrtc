import ReactDOM, { Root } from "react-dom/client";
import { ZegoCloudRoomConfig } from "./model/index";
import { ZegoCloudRTCCore } from "./modules/index";
import { ZegoCloudRTCKitComponent } from "./view/index";

export class ZegoUIKitPrebuilt {
  static core: ZegoCloudRTCCore;
  static _instance: ZegoUIKitPrebuilt;

  root: Root | undefined;

  static create(token: string): ZegoUIKitPrebuilt {
    if (!ZegoUIKitPrebuilt.core && token) {
      ZegoUIKitPrebuilt.core = ZegoCloudRTCCore.getInstance(token);
      ZegoUIKitPrebuilt._instance = new ZegoUIKitPrebuilt();
    }
    return ZegoUIKitPrebuilt._instance;
  }

  joinRoom(roomConfig?: ZegoCloudRoomConfig) {
    if (!ZegoUIKitPrebuilt.core) {
      console.error("【ZEGOCLOUD】 please call init first !!");
      return;
    }

    if (!roomConfig || !roomConfig.container) {
      console.warn("【ZEGOCLOUD】joinRoom/roomConfig/container required !!");
      const div = document.createElement("div");
      div.style.position = "fixed";
      div.style.width = "100vw";
      div.style.height = "100vh";
      div.style.minWidth = "345px";
      div.style.top = "0px";
      div.style.left = "0px";
      div.style.zIndex = "100";
      div.style.backgroundColor = "#FFFFFF";
      div.style.overflow = "auto";
      document.body.appendChild(div);
      roomConfig = {
        ...roomConfig,
        ...{
          container: div,
        },
      };
    }

    ZegoUIKitPrebuilt.core.setConfig(roomConfig);
    this.root = ReactDOM.createRoot(roomConfig.container as HTMLDivElement);
    this.root.render(
      <ZegoCloudRTCKitComponent
        core={ZegoUIKitPrebuilt.core}
      ></ZegoCloudRTCKitComponent>
    );
  }

  destroy() {
    ZegoUIKitPrebuilt.core.leaveRoom();
    this.root?.unmount();
    this.root = undefined;
  }
}
