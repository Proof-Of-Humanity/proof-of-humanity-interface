import React from "react";
import Popup from "reactjs-popup";

interface PreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  trigger: JSX.Element | ((isOpen: boolean) => JSX.Element) | undefined;
  children: React.ReactNode;
}

const Preview: React.FC<PreviewProps> = ({ trigger, children }) => (
  <Popup trigger={trigger} modal nested>
    {(close) => (
      <div className="backdrop" onClick={close}>
        {children}
      </div>
    )}
  </Popup>
);

export default Preview;
