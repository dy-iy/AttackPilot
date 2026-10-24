"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Form, Input, Modal, Segmented, Typography } from "antd";
import { loginUser, registerUser, type AuthUser } from "@/lib/api";
import { errorMessage } from "./attackpilot/services/api";

type Credentials = { username: string; password: string; confirmPassword?: string };

export default function AuthDialog({ open, onClose, onAuthenticated }: {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void;
}) {
  const [form] = Form.useForm<Credentials>();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) { form.resetFields(); setError(""); }
  }, [form, open]);

  async function submit(values: Credentials) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await (mode === "register" ? registerUser : loginUser)(values.username.trim(), values.password);
      form.resetFields();
      onAuthenticated(response.user);
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setPending(false); }
  }

  return <Modal title="欢迎使用 AttackPilot" open={open} onCancel={onClose}
    footer={null} closable={!pending} mask={{ closable: !pending }} keyboard={!pending} destroyOnHidden>
    <Segmented block aria-label="账号操作" value={mode} disabled={pending}
      options={[{ label: "登录", value: "login" }, { label: "注册", value: "register" }]}
      onChange={value => { setMode(value as "login" | "register"); setError(""); form.resetFields(["password", "confirmPassword"]); }} />
    <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
      公共历史案例可直接浏览，登录后可创建自己的复盘任务并使用取证助手。
    </Typography.Paragraph>
    {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
    <Form form={form} layout="vertical" onFinish={submit} disabled={pending} requiredMark={false}>
      <Form.Item name="username" label="用户名" rules={[
        { required: true, message: "请输入用户名" },
        { pattern: /^[A-Za-z0-9_.-]{3,32}$/, message: "使用 3–32 位字母、数字、下划线、短横线或点" },
      ]}>
        <Input autoComplete="username" maxLength={32} autoFocus placeholder="输入用户名" />
      </Form.Item>
      <Form.Item name="password" label="密码" rules={[
        { required: true, message: "请输入密码" },
        ...(mode === "register" ? [{ min: 10, message: "密码至少需要 10 位" }] : []),
      ]} extra={mode === "register" ? "使用 10–128 位密码，包含大小写字母、数字、符号中的至少 3 类，且不包含用户名。" : undefined}>
        <Input.Password autoComplete={mode === "register" ? "new-password" : "current-password"} maxLength={128} placeholder="输入密码" />
      </Form.Item>
      {mode === "register" && <Form.Item name="confirmPassword" label="确认密码" dependencies={["password"]} rules={[
        { required: true, message: "请再次输入密码" },
        ({ getFieldValue }) => ({ validator: (_, value: string) => !value || getFieldValue("password") === value
          ? Promise.resolve() : Promise.reject(new Error("两次密码不一致")) }),
      ]}>
        <Input.Password autoComplete="new-password" maxLength={128} placeholder="再次输入密码" />
      </Form.Item>}
      <Button block type="primary" htmlType="submit" loading={pending}>{mode === "register" ? "注册并登录" : "登录"}</Button>
    </Form>
  </Modal>;
}
