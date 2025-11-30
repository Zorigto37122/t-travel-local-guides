import { createPortal } from "react-dom";
import { useState } from "react";
import { useRef, useEffect } from "react";
import cross from "../../assets/cross.svg";
import "./SignForm.css";
import Button from "../Button/Button";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function SignForm({ children, open, toClose }) {
  const [formType, setFormType] = useState("login");

  const handleSwitch = (type) => {
    setFormType(type);
  };

  const dialogRef = useRef();

  useEffect(() => {
    if (open) {
      dialogRef.current.showModal();
      document.body.classList.add("overflow-y-hidden");
      console.log("opened");
    } else {
      if (dialogRef.current.open) {
        dialogRef.current.close();
      }
      document.body.classList.remove("overflow-y-hidden");
      console.log("closed");
    }
  }, [open]);

  useEffect(() => {
    const dialogElement = dialogRef.current;

    const handleCloseEvent = () => {
      toClose(false);
      document.body.classList.remove("overflow-y-hidden");
    };

    if (dialogElement) {
      dialogElement.addEventListener("close", handleCloseEvent);
    }

    return () => {
      if (dialogElement) {
        dialogElement.removeEventListener("close", handleCloseEvent);
      }
    };
  }, [toClose]);

  return createPortal(
    <dialog ref={dialogRef} className={`SignForm SignForm--${formType}`}>
      <div className="SignForm__container">
        <div className="SignForm__switcher">
          <Button
            className={`SignForm__tab ${
              formType === "login" ? "SignForm__tab--active" : ""
            }`}
            onClick={() => handleSwitch("login")}
          >
            Вход
          </Button>
          <Button
            className={`SignForm__tab ${
              formType === "register" ? "SignForm__tab--active" : ""
            }`}
            onClick={() => handleSwitch("register")}
          >
            Регистрация
          </Button>
        </div>

        <div className="SignForm__content">
          {formType === "login" ? (
            <LoginForm toClose={toClose} />
          ) : (
            <RegisterForm toClose={toClose} />
          )}
        </div>

        <Button
          className="SignForm__close-button"
          onClick={() => toClose(false)}
        >
          <img src={cross}></img>
        </Button>
      </div>
    </dialog>,
    document.getElementById("modal")
  );
}
