import ALink from "components/ALink";
import { FALLBACK_CHAIN } from "constants/chains";
import useChangeChain from "hooks/useChangeChain";
import useWeb3 from "hooks/useWeb3";
import SubmissionForm from "modules/form";
import React from "react";
import { injected } from "utils/connectors";

const Claim: React.FC = () => {
  const { account, active, activate } = useWeb3();
  const changeChain = useChangeChain();

  return (
    <div
      className="mx-auto mt-8 mb-16 px-4 py-4 w-11/12
                 sm:mt-12 sm:px-8 sm:py-6 sm:w-5/6
                 lg:mt-16 lg:px-10 lg:py-6 lg:w-3/5
                 flex flex-col
                 border rounded bg-white shadow"
    >
      {active ? (
        <SubmissionForm />
      ) : (
        <>
          <div className="w-full my-4 flex flex-col text-2xl font-extralight">
            <span>Create your</span>
            <span>
              <strong className="font-semibold uppercase">
                Proof of Humanity
              </strong>{" "}
              Profile
            </span>
            <div className="divider mt-4 w-2/3" />
          </div>
          <span className="txt">
            You don't have a wallet connected to the website
          </span>

          {account ? (
            <button
              className="btn-main my-8"
              onClick={() => changeChain(FALLBACK_CHAIN)}
            >
              Switch to supported chain
            </button>
          ) : (
            <button
              className="btn-main my-8"
              onClick={() => activate(injected)}
            >
              Connect wallet
            </button>
          )}
          <span className="txt">
            Don't have a wallet? Click{" "}
            <ALink
              className="text-blue-500"
              href="https://ethereum.org/en/wallets/find-wallet/"
            >
              here
            </ALink>{" "}
            to learn on how to create one!
          </span>
        </>
      )}
    </div>
  );
};

export default Claim;
