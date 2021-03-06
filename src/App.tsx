import React from "react";
import APP from "./App.module.scss";
import { ZegoPrebuilt } from "./sdk/index";
import { getUrlParams, isPc } from "./sdk/util";
import { generateToken, randomID } from "./util";
export default class App extends React.Component {
  myMeeting: (element: HTMLDivElement) => Promise<void>;

  constructor(props: Readonly<{}>) {
    super(props);
    // @es
    const roomID = getUrlParams(window.location.href)["roomID"] || randomID(5);
    this.myMeeting = async (element: HTMLDivElement) => {
      const { token } = await generateToken(
        "https://choui-prebuilt.herokuapp.com",
        randomID(5),
        roomID,
        randomID(5)
      );
      const zgc = ZegoPrebuilt.init(token);
      zgc.joinRoom({
        container: element,
        // notification: { unreadMessageTips: true, userOnlineOfflineTips: true },
        joinScreen: {
          inviteURL:
            window.location.origin +
            window.location.pathname +
            "?roomID=" +
            roomID,
          visible: true,
          title: "Join Room",
        },
        // micEnabled: false, // 是否开启自己的麦克风,默认开启
        // cameraEnabled: true, // 是否开启自己的摄像头 ,默认开启
        // userCanToggleSelfCamera: false, // 是否可以控制自己的麦克风,默认开启
        // userCanToggleSelfMic: false, // 是否可以控制体自己的摄像头,默认开启
        deviceSettings: true,
        // branding: {
        //   logoURL:
        //     "https://www.zegocloud.com/_nuxt/img/zegocloud_logo_white.ddbab9f.png",
        // },
      });
    };
  }

  render(): React.ReactNode {
    return (
      <div className={APP.app}>
        <div className={`${APP.nav} ${isPc() ? "" : APP.mobileNav}`}>
          <div
            className={`${APP.LOGO} ${isPc() ? "" : APP.mobileLOGO}`}
            onClick={() => {
              window.open("https://www.zegocloud.com", "_blank");
            }}
          ></div>
          <div className={`${APP.link} ${isPc() ? "" : APP.mobileLink}`}>
            <a
              href="https://docs.zegocloud.com/article/5546"
              target="_blank"
              className={APP.link_item}
              rel="noreferrer"
            >
              <span className={APP.icon__doc}></span>{" "}
              {isPc() && "Documentation"}
            </a>
            <a
              href="https://github.com/ZEGOCLOUD/zegocloud_prebuilt_webrtc"
              target="_blank"
              className={APP.link_item}
              rel="noreferrer"
            >
              <span className={APP.icon__github}></span>
              {isPc() && "View demo code"}
            </a>
          </div>
        </div>
        <div ref={this.myMeeting} className={APP.myMeeting}></div>
        <div
          className={`${APP.serviceTips}  ${
            isPc() ? APP.pcServiceTips : APP.mobileServiceTips
          }`}
        >
          By clicking "Join", you agree to {!isPc() && <br />} our{" "}
          <a
            href="https://www.zegocloud.com/policy?index=1"
            target="_blank"
            rel="noreferrer"
          >
            Terms of Services
          </a>{" "}
          and{" "}
          <a
            href="https://www.zegocloud.com/policy?index=0"
            target="_blank"
            rel="noreferrer"
          >
            Privacy Policy
          </a>
          .
        </div>
      </div>
    );
  }
}
