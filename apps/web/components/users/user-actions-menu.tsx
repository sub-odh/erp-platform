"use client";

import { Archive, KeyRound, MoreHorizontal, Pencil, Power } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { User } from "@/types/user";

interface UserActionsMenuProps {
  user: User;
  currentUserId: string | null;
  busy: boolean;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onArchive: (user: User) => void;
}

interface MenuPosition {
  top: number;
  left: number;
}

const MENU_WIDTH = 224;
const MENU_GAP = 8;

export function UserActionsMenu({
  user,
  currentUserId,
  busy,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onArchive,
}: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = user.role === "OWNER";
  const isCurrentUser = user.id === currentUserId;
  const actionsDisabled = busy || isOwner;

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition(): void {
      const button = buttonRef.current;

      if (!button) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const viewportPadding = 12;

      let left = rect.right - MENU_WIDTH;

      left = Math.max(
        viewportPadding,
        Math.min(left, window.innerWidth - MENU_WIDTH - viewportPadding),
      );

      const estimatedMenuHeight = 220;
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldOpenAbove =
        spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight;

      setPosition({
        left,
        top: shouldOpenAbove
          ? rect.top - estimatedMenuHeight - MENU_GAP
          : rect.bottom + MENU_GAP,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;

      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function runAction(action: () => void): void {
    setOpen(false);
    action();
  }

  const menu =
    mounted && open && position
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: MENU_WIDTH,
            }}
            className="z-100 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-2xl shadow-slate-900/15"
          >
            <MenuButton
              icon={<Pencil size={16} />}
              disabled={actionsDisabled}
              onClick={() => runAction(() => onEdit(user))}
            >
              Edit
            </MenuButton>

            <MenuButton
              icon={<KeyRound size={16} />}
              disabled={actionsDisabled || isCurrentUser}
              onClick={() => runAction(() => onResetPassword(user))}
            >
              Reset password
            </MenuButton>

            <div className="my-1 border-t border-slate-100" />

            <MenuButton
              icon={<Power size={16} />}
              disabled={actionsDisabled || (isCurrentUser && user.isActive)}
              onClick={() => runAction(() => onToggleStatus(user))}
            >
              {user.isActive ? "Deactivate" : "Activate"}
            </MenuButton>

            <div className="my-1 border-t border-slate-100" />

            <MenuButton
              icon={<Archive size={16} />}
              disabled={actionsDisabled || isCurrentUser}
              danger
              onClick={() => runAction(() => onArchive(user))}
            >
              Archive user
            </MenuButton>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${user.firstName} ${user.lastName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((current) => !current)}
        className={[
          "inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white transition",
          open
            ? "border-blue-500 text-blue-700 ring-2 ring-blue-100"
            : "border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900",
          "disabled:cursor-not-allowed disabled:opacity-50",
        ].join(" ")}
      >
        <MoreHorizontal size={18} />
      </button>

      {menu}
    </>
  );
}

function MenuButton({
  children,
  icon,
  disabled = false,
  danger = false,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition",
        danger
          ? "text-red-700 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-50",
        "disabled:cursor-not-allowed disabled:opacity-40",
      ].join(" ")}
    >
      <span className="shrink-0">{icon}</span>
      <span>{children}</span>
    </button>
  );
}
