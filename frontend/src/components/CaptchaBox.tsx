import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { CaptchaOut } from "../types";
import { RefreshIcon } from "./icons";

interface Props {
  onChange: (token: string, answer: string) => void;
}

export function CaptchaBox({ onChange }: Props) {
  const [captcha, setCaptcha] = useState<CaptchaOut | null>(null);
  const [answer, setAnswer] = useState("");

  const refresh = () => {
    setAnswer("");
    apiClient.get<CaptchaOut>("/public/captcha").then(({ data }) => {
      setCaptcha(data);
      onChange(data.token, "");
    });
  };

  useEffect(refresh, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {captcha ? (
        <img
          src={`data:image/png;base64,${captcha.image_base64}`}
          alt="captcha"
          className="h-11 shrink-0 rounded border border-slate-300"
        />
      ) : (
        <div className="h-11 w-[140px] shrink-0 animate-pulse rounded border border-slate-200 bg-slate-100" />
      )}
      <button
        type="button"
        onClick={refresh}
        title="Kodni yangilash"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-brand-600 text-white hover:bg-brand-700"
      >
        <RefreshIcon className="h-4 w-4" />
      </button>
      <input
        value={answer}
        onChange={(e) => {
          setAnswer(e.target.value);
          if (captcha) onChange(captcha.token, e.target.value);
        }}
        placeholder="----"
        maxLength={4}
        className="h-11 w-20 shrink-0 rounded border border-slate-300 px-2 text-center tracking-widest focus:border-brand-500 focus:outline-none"
      />
    </div>
  );
}
