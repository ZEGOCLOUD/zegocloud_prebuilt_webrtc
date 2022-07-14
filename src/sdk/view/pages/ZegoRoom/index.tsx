import React, { RefObject } from "react";
import {
  ZegoBrowserCheckProp,
  ZegoCloudRemoteMedia,
  ZegoNotification,
} from "../../../model";
import ZegoRoomCss from "./index.module.scss";
import {
  ZegoUser,
  ZegoBroadcastMessageInfo,
} from "zego-express-engine-webrtm/sdk/code/zh/ZegoExpressEntity.d";

import { ZegoTimer } from "./components/zegoTimer";
import { ZegoOne2One } from "./components/zegoOne2One";
import { ZegoMessage } from "./components/zegoMessage";
import { randomID } from "../../../util";
import { ZegoSettingsAlert } from "../../components/zegoSetting";
import { copy } from "../../../modules/util";
import { userNameColor } from "../../../util";
import { ZegoModelShow } from "../../components/zegoModel";
export class ZegoRoom extends React.Component<ZegoBrowserCheckProp> {
  state: {
    localStream: undefined | MediaStream;
    remoteStreamInfo: ZegoCloudRemoteMedia | undefined;
    layOutStatus: "ONE_VIDEO" | "INVITE" | "USER_LIST" | "MESSAGE";
    userList: ZegoUser[];
    messageList: ZegoBroadcastMessageInfo[];
    notificationList: ZegoNotification[];
    micOpen: boolean;
    cameraOpen: boolean;
    showSettings: boolean;
    isNetworkPoor: boolean;
    reconnect: boolean;
  } = {
    localStream: undefined,
    remoteStreamInfo: undefined,
    layOutStatus: "ONE_VIDEO",
    userList: [],
    messageList: [],
    notificationList: [],
    micOpen: !!this.props.core._config.micEnabled,
    cameraOpen: !!this.props.core._config.cameraEnabled,
    showSettings: false,
    isNetworkPoor: false,
    reconnect: false,
  };
  inviteRef: RefObject<HTMLInputElement> = React.createRef();
  settingsRef: RefObject<HTMLDivElement> = React.createRef();
  moreRef: RefObject<HTMLDivElement> = React.createRef();
  componentDidMount() {
    this.initSDK();
    // 点击其他区域时, 隐藏更多弹窗)
    document.addEventListener("click", this.onOpenSettings);
  }
  componentWillUnmount() {
    document.removeEventListener("click", this.onOpenSettings);
  }
  async initSDK() {
    this.props.core.onNetworkStatus(
      (
        roomID: string,
        type: "ROOM" | "STREAM",
        status: "DISCONNECTED" | "CONNECTING" | "CONNECTED"
      ) => {
        if (status === "DISCONNECTED") {
          this.leaveRoom();
        }
      }
    );
    this.props.core.onRemoteUserUpdate(
      (roomID: string, updateType: "DELETE" | "ADD", userList: ZegoUser[]) => {
        let notificationList: ZegoNotification[] = [];
        if (this.props.core._config.notification?.userOnlineOfflineTips) {
          userList.map((u) => {
            notificationList.push({
              content:
                u.userName +
                " " +
                (updateType === "ADD" ? "enter" : "quite") +
                " the room",
              type: "USER",
              userName: u.userName,
            });
          });
        }
        if (updateType === "ADD") {
          this.setState(
            (state: { userList: ZegoUser[]; notificationList: string[] }) => {
              return {
                userList: [...state.userList, ...userList],
                notificationList: [
                  ...state.notificationList,
                  ...notificationList,
                ],
              };
            }
          );
        } else if (updateType === "DELETE") {
          this.setState(
            (state: { userList: ZegoUser[]; notificationList: string[] }) => {
              return {
                userList: state.userList.filter(
                  (user1) =>
                    !userList.some((user2) => user1.userID === user2.userID)
                ),
                notificationList: [
                  ...state.notificationList,
                  ...notificationList,
                ],
              };
            }
          );
        }
      }
    );
    this.props.core.onRemoteMediaUpdate(
      (
        updateType: "DELETE" | "ADD" | "UPDATE",
        streamList: ZegoCloudRemoteMedia[]
      ) => {
        if (updateType === "ADD" || updateType === "UPDATE") {
          this.setState({
            remoteStreamInfo: streamList[0],
          });
        } else if (updateType === "DELETE") {
          this.setState({
            remoteStreamInfo: undefined,
          });
        }
      }
    );
    this.props.core.onRoomMessageUpdate(
      (roomID: string, messageList: ZegoBroadcastMessageInfo[]) => {
        this.setState(
          (state: {
            messageList: ZegoBroadcastMessageInfo[];
            notificationList: ZegoNotification[];
          }) => {
            let notification: ZegoNotification[] = [];
            if (
              this.state.layOutStatus !== "MESSAGE" &&
              this.props.core._config.notification?.unreadMessageTips
            ) {
              notification = [
                ...state.notificationList,
                ...messageList.map<ZegoNotification>((m) => {
                  return {
                    content: m.message,
                    type: "MSG",
                    userName: m.fromUser.userName,
                  };
                }),
              ];
            }
            return {
              messageList: [...state.messageList, ...messageList],
              notificationList: notification,
            };
          }
        );
      }
    );

    const logInRsp = await this.props.core.enterRoom();

    logInRsp === 0 &&
      this.createStream(
        !!this.props.core._config.cameraEnabled,
        !!this.props.core._config.micEnabled
      );
  }

  async createStream(video: boolean, audio: boolean): Promise<boolean> {
    if (video || audio) {
      try {
        const localStream = await this.props.core.createStream({
          camera: {
            video,
            audio,
          },
        });

        this.setState({
          localStream,
        });
        this.props.core.publishLocalStream(localStream);
        return true;
      } catch (error) {
        console.error(
          "【ZEGOCLOUD】createStream or publishLocalStream failed,Reason: ",
          JSON.stringify(error)
        );
        return false;
      }
    } else {
      return false;
    }
  }

  async toggleMic() {
    this.setState(
      {
        micOpen: !this.state.micOpen,
      },
      async () => {
        if (
          this.state.localStream &&
          this.state.localStream.getAudioTracks().length > 0
        ) {
          this.props.core.muteMicrophone(this.state.micOpen);
        } else {
          const res = await this.createStream(
            !!this.state.cameraOpen,
            !!this.state.micOpen
          );
          !res &&
            this.setState({
              micOpen: !this.state.micOpen,
            });
        }
      }
    );
  }

  async toggleCamera() {
    this.setState(
      {
        cameraOpen: !this.state.cameraOpen,
      },
      async () => {
        if (
          this.state.localStream &&
          this.state.localStream.getVideoTracks().length > 0
        ) {
          this.props.core.enableVideoCaptureDevice(
            this.state.localStream,
            this.state.cameraOpen
          );
        } else {
          const res = await this.createStream(
            !!this.state.cameraOpen,
            !!this.state.micOpen
          );
          !res &&
            this.setState({
              cameraOpen: !this.state.cameraOpen,
            });
        }
      }
    );
  }

  toggleLayOut(layOutStatus: "ONE_VIDEO" | "INVITE" | "USER_LIST" | "MESSAGE") {
    this.setState(
      (state: {
        layOutStatus: "ONE_VIDEO" | "INVITE" | "USER_LIST" | "MESSAGE";
      }) => {
        return {
          layOutStatus:
            state.layOutStatus === layOutStatus ? "ONE_VIDEO" : layOutStatus,
        };
      }
    );
  }

  sendMessage(msg: string) {
    this.props.core.sendRoomMessage(msg);

    this.setState((state: { messageList: ZegoBroadcastMessageInfo[] }) => {
      return {
        messageList: [
          ...state.messageList,
          {
            fromUser: {
              userID: this.props.core._expressConfig.userID,
              userName: this.props.core._expressConfig.userName,
            },
            message: msg,
            sendTime: Date.now(),
            messageID: randomID(3),
          },
        ],
      };
    });
  }

  openSettings() {
    this.setState({
      showSettings: !this.state.showSettings,
    });
  }
  onOpenSettings = (event: any) => {
    if (
      this.settingsRef.current === event.target ||
      this.settingsRef.current?.contains(event.target as Node) ||
      this.moreRef.current === event.target ||
      this.moreRef.current?.contains(event.target as Node)
    ) {
    } else {
      this.setState({
        showSettings: false,
      });
    }
  };
  handleSetting() {
    ZegoSettingsAlert({
      core: this.props.core,
      theme: "black",
      closeCallBack: () => {},
      localAudioStream: this.state.localStream,
      localVideoStream: this.state.localStream,
    });
  }
  handleLeave() {
    ZegoModelShow({
      header: "Leave the room",
      contentText: "Are you sure to leave the room?",
      okText: "Confirm",
      cancelText: "Cancel",
      onOk: () => {
        this.leaveRoom();
      },
    });
  }
  leaveRoom() {
    this.props.core.leaveRoom();
    this.props.leaveRoom && this.props.leaveRoom();
  }
  handleCopy() {
    this.inviteRef.current &&
      copy(this.inviteRef.current.value, this.inviteRef.current);
    // TODO: toast 提示 copy success
  }

  getListScreen() {
    if (this.state.layOutStatus === "INVITE") {
      return (
        <>
          <div className={ZegoRoomCss.listHeader}>
            Room details
            <span
              className={ZegoRoomCss.listHeaderClose}
              onClick={() => {
                this.setState({
                  layOutStatus: "ONE_VIDEO",
                });
              }}
            ></span>
          </div>
          <div className={ZegoRoomCss.listContent}>
            <div className={ZegoRoomCss.inviteLinkWrapper}>
              <div className={ZegoRoomCss.title}>Share the Link</div>
              <input
                className={ZegoRoomCss.inviteLink}
                placeholder="inviteLink"
                readOnly
                value={this.props.core._config.joinScreen?.inviteURL}
                ref={this.inviteRef}
              ></input>
              <div
                className={ZegoRoomCss.copyLinkButton}
                onClick={() => {
                  this.handleCopy();
                }}
              >
                Copy
              </div>
            </div>
          </div>
        </>
      );
    } else if (this.state.layOutStatus === "USER_LIST") {
      return (
        <>
          <div className={ZegoRoomCss.listHeader}>
            Room members
            <span
              className={ZegoRoomCss.listHeaderClose}
              onClick={() => {
                this.setState({
                  layOutStatus: "ONE_VIDEO",
                });
              }}
            ></span>
          </div>
          <div className={ZegoRoomCss.listContent}>
            <div className={ZegoRoomCss.memberListWrapper}>
              <div className={ZegoRoomCss.member}>
                <span
                  style={{
                    color: userNameColor(
                      this.props.core._expressConfig.userName
                    ),
                  }}
                >
                  {this.props.core._expressConfig.userName
                    .slice(0, 1)
                    ?.toUpperCase()}
                </span>
                <p>{this.props.core._expressConfig.userName} (Me)</p>
              </div>
              {this.state.userList.map((user) => {
                return (
                  <div className={ZegoRoomCss.member}>
                    <span style={{ color: userNameColor(user.userName || "") }}>
                      {user.userName?.slice(0, 1)?.toUpperCase()}
                    </span>
                    <p>{user.userName}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      );
    } else if (this.state.layOutStatus === "MESSAGE") {
      return (
        <>
          <div className={ZegoRoomCss.listHeader}>
            Room messages
            <span
              className={ZegoRoomCss.listHeaderClose}
              onClick={() => {
                this.setState({
                  layOutStatus: "ONE_VIDEO",
                });
              }}
            ></span>
          </div>
          <div className={ZegoRoomCss.listContent}>
            <ZegoMessage
              messageList={this.state.messageList}
              sendMessage={(msg: string) => {
                this.sendMessage(msg);
              }}
              selfUserID={this.props.core._expressConfig.userID}
            ></ZegoMessage>
          </div>
        </>
      );
    }
  }

  render(): React.ReactNode {
    const startIndex =
      this.state.notificationList.length < 4
        ? 0
        : this.state.notificationList.length - 2;
    return (
      <div className={ZegoRoomCss.ZegoRoom}>
        <div className={ZegoRoomCss.header}>
          {this.props.core._config.branding?.logoURL && (
            <img
              className={ZegoRoomCss.logo}
              src={this.props.core._config.branding?.logoURL}
              alt="logo"
            />
          )}
          {this.props.core._config.roomTimerDisplayed && (
            <ZegoTimer></ZegoTimer>
          )}
        </div>
        <div className={ZegoRoomCss.content}>
          <div className={ZegoRoomCss.contentLeft}>
            <ZegoOne2One
              localStream={this.state.localStream}
              remoteStreamInfo={this.state.remoteStreamInfo}
              selfUserInfo={{
                userName: this.props.core._expressConfig.userName,
                micOpen: this.state.micOpen,
                cameraOpen: this.state.cameraOpen,
              }}
            ></ZegoOne2One>
            <div className={ZegoRoomCss.notify}>
              {this.state.notificationList.slice(startIndex).map((notify) => {
                if (notify.type === "MSG") {
                  return (
                    <div
                      key={notify.content}
                      className={ZegoRoomCss.notifyContent}
                    >
                      <h5>{notify.userName}</h5>
                      <span>{notify.content}</span>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={notify.content}
                      className={ZegoRoomCss.notifyContent}
                    >
                      {notify.content}
                    </div>
                  );
                }
              })}
            </div>
            {this.state.isNetworkPoor && (
              <div className={ZegoRoomCss.network}></div>
            )}
          </div>
          <div
            className={ZegoRoomCss.contentRight}
            style={{
              display:
                this.state.layOutStatus !== "ONE_VIDEO" ? "flex" : "none",
            }}
          >
            {this.getListScreen()}
          </div>
        </div>
        <div className={ZegoRoomCss.footer}>
          {this.props.core._config.joinScreen?.inviteURL && (
            <div
              className={ZegoRoomCss.inviteButton}
              onClick={() => {
                this.toggleLayOut("INVITE");
              }}
            ></div>
          )}

          <div className={ZegoRoomCss.handlerMiddle}>
            {this.props.core._config.userCanToggleSelfMic && (
              <div
                className={`${ZegoRoomCss.micButton} ${!this.state.micOpen &&
                  ZegoRoomCss.close}`}
                onClick={() => {
                  this.toggleMic();
                }}
              ></div>
            )}
            {this.props.core._config.userCanToggleSelfCamera && (
              <div
                className={`${ZegoRoomCss.cameraButton} ${!this.state
                  .cameraOpen && ZegoRoomCss.close}`}
                onClick={() => {
                  this.toggleCamera();
                }}
              ></div>
            )}
            <div
              ref={this.moreRef}
              className={ZegoRoomCss.moreButton}
              onClick={() => {
                this.openSettings();
              }}
            >
              <div
                className={ZegoRoomCss.settingsButtonModel}
                style={{
                  display: this.state.showSettings ? "block" : "none",
                }}
                ref={this.settingsRef}
              >
                {/* <div>Change the layout</div>
                <span></span> */}
                <div onClick={() => this.handleSetting()}>Setting</div>
              </div>
            </div>
            <div
              className={ZegoRoomCss.leaveButton}
              onClick={() => {
                this.handleLeave();
              }}
            ></div>
          </div>
          <div className={ZegoRoomCss.handlerRight}>
            {this.props.core._config.userListEnabled && (
              <div
                className={ZegoRoomCss.memberButton}
                onClick={() => {
                  this.toggleLayOut("USER_LIST");
                }}
              ></div>
            )}
            {this.props.core._config.chatEnabled && (
              <div
                className={ZegoRoomCss.msgButton}
                onClick={() => {
                  this.toggleLayOut("MESSAGE");
                }}
              ></div>
            )}
          </div>
        </div>
        <div
          className={ZegoRoomCss.reconnect}
          style={{
            display: this.state.reconnect ? "flex" : "none",
          }}
        >
          <div></div>
          <p>Trying to reconnect...</p>
        </div>
      </div>
    );
  }
}
