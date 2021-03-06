import React, { ChangeEvent } from "react";
import ReactDOM from "react-dom/client";

import ZegoConfirmCss from "./index.module.scss";
export class ZegoConfirmComponents extends React.Component<{
  closeCallBack: (confirm: boolean) => void;
  title: string;
  content?: string;
  cancel?: string;
  confirm?: string;
}> {
  render(): React.ReactNode {
    return (
      <div className={ZegoConfirmCss.ZegoConfirm}>
        <div className={ZegoConfirmCss.content}>
          <p className={ZegoConfirmCss.tipsHeader}>{this.props.title}</p>
          <p className={ZegoConfirmCss.tipsText}>{this.props.content}</p>
          <div className={ZegoConfirmCss.handler}>
            {this.props.cancel && (
              <button
                onClick={() => {
                  this.props.closeCallBack(false);
                }}
              >
                {this.props.cancel}
              </button>
            )}
            {this.props.confirm && (
              <button
                onClick={() => {
                  this.props.closeCallBack(true);
                }}
              >
                {this.props.confirm}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export const ZegoConfirm = (config?: {
  closeCallBack?: (confirm: boolean) => void;
  title?: string;
  content?: string;
  cancel?: string;
  confirm?: string;
}) => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = ReactDOM.createRoot(div);
  root.render(
    <ZegoConfirmComponents
      closeCallBack={(confirm: boolean) => {
        root.unmount();
        config && config.closeCallBack && config.closeCallBack(confirm);
      }}
      title={config?.title || ""}
      content={config?.content || ""}
      confirm={config?.confirm || ""}
      cancel={config?.cancel || ""}
    ></ZegoConfirmComponents>
  );
};
