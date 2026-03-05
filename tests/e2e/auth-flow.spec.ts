// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import fs from "node:fs";

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "../../src/app/auth/login-page";
import RegisterPage from "../../src/app/auth/register-page";
import { logoutUser, setSessionUser } from "../../src/app/foundation/runtime";

describe("auth flow", () => {
  beforeEach(async () => {
    setSessionUser(null);
    await logoutUser();
  });

  afterEach(() => {
    cleanup();
  });

  it("registers then authenticates user", async () => {
    const user = userEvent.setup();
    const onRegistered = vi.fn();

    render(React.createElement(RegisterPage, { onRegistered }));

    await user.type(screen.getByLabelText("Email"), "owner@home.app");
    await user.type(screen.getByLabelText("Senha (minimo 6 caracteres)"), "secret12");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(onRegistered).toHaveBeenCalledTimes(1);

    const onAuthenticated = vi.fn();
    cleanup();
    render(React.createElement(LoginPage, { onAuthenticated }));

    await user.type(screen.getByLabelText("Email"), "owner@home.app");
    await user.type(screen.getByLabelText("Senha"), "secret12");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(onAuthenticated).toHaveBeenCalledTimes(1);
  });

  it("shows invalid credentials error on wrong password", async () => {
    const user = userEvent.setup();

    render(React.createElement(RegisterPage, { onRegistered: () => undefined }));
    await user.type(screen.getByLabelText("Email"), "owner@home.app");
    await user.type(screen.getByLabelText("Senha (minimo 6 caracteres)"), "secret12");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    cleanup();
    const onAuthenticated = vi.fn();
    render(React.createElement(LoginPage, { onAuthenticated }));
    await user.type(screen.getByLabelText("Email"), "owner@home.app");
    await user.type(screen.getByLabelText("Senha"), "wrong");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it("keeps auth pages without public cross-links and noindex fallback in html shell", () => {
    render(React.createElement(LoginPage, { onAuthenticated: () => undefined }));
    expect(screen.queryByRole("button", { name: /n-account/i })).not.toBeInTheDocument();

    cleanup();
    render(React.createElement(RegisterPage, { onRegistered: () => undefined }));
    expect(screen.queryByRole("button", { name: /voltar para \/login/i })).not.toBeInTheDocument();

    const html = fs.readFileSync("index.html", "utf8");
    expect(html).toContain('name="robots"');
    expect(html).toContain("noindex");
  });
});
