"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { isDemoAccountLogin } from "@/modules/auth/demoLogin";
import { roleLabel, type UserRole, USER_ROLES } from "@/modules/auth/client";
import {
  deleteProfileAction,
  setProfileBannedAction,
  type ProfileModerationActionState,
} from "@/modules/admin-profiles/actions";
import type { AdminProfile } from "@/modules/admin-profiles/types";
import css from "./AdminProfilesPanel.module.css";

const BAN_INITIAL: ProfileModerationActionState = { status: "idle" };
const DELETE_INITIAL: ProfileModerationActionState = { status: "idle" };

type RoleFilter = "all" | UserRole;

type AdminProfilesPanelProps = {
  profiles: AdminProfile[];
  currentUserId: number;
};

function formatCreatedAt(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(date);
}

function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function AdminProfilesPanel({
  profiles,
  currentUserId,
}: AdminProfilesPanelProps) {
  const t = useTranslations("AdminProfiles");
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [banState, banAction, banPending] = useActionState(
    setProfileBannedAction,
    BAN_INITIAL,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteProfileAction,
    DELETE_INITIAL,
  );

  const pending = banPending || deletePending;
  const flash = banState.status !== "idle" ? banState : deleteState;

  useEffect(() => {
    if (banState.status === "success" || deleteState.status === "success") {
      router.refresh();
    }
  }, [banState, deleteState, router]);

  const filtered = useMemo(() => {
    if (roleFilter === "all") return profiles;
    return profiles.filter((profile) => profile.role === roleFilter);
  }, [profiles, roleFilter]);

  const locale =
    typeof document !== "undefined"
      ? document.documentElement.lang || "uk"
      : "uk";

  return (
    <div className={css.layout}>
      <section className={css.panel} aria-labelledby="admin-profiles-title">
        <div>
          <h2 id="admin-profiles-title" className={css.panelTitle}>
            {t("listTitle")}
          </h2>
          <p className={css.panelLead}>{t("listLead")}</p>
        </div>

        <div
          className={css.filters}
          role="group"
          aria-label={t("filterLabel")}
        >
          <button
            type="button"
            className={clsx(
              css.filterChip,
              roleFilter === "all" && css.filterChipActive,
            )}
            aria-pressed={roleFilter === "all"}
            onClick={() => setRoleFilter("all")}
          >
            {t("filterAll", { count: profiles.length })}
          </button>
          {USER_ROLES.map((role) => {
            const count = profiles.filter((p) => p.role === role).length;
            return (
              <button
                key={role}
                type="button"
                className={clsx(
                  css.filterChip,
                  roleFilter === role && css.filterChipActive,
                )}
                aria-pressed={roleFilter === role}
                onClick={() => setRoleFilter(role)}
              >
                {t("filterRole", { role: roleLabel(role), count })}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className={css.empty}>{t("emptyFilter")}</p>
        ) : (
          <ul className={css.list}>
            {filtered.map((profile) => {
              const isSelf = profile.id === currentUserId;
              const isProtected = isDemoAccountLogin(profile.login);
              const canModerate = !isSelf && !isProtected;

              return (
                <li
                  key={profile.id}
                  className={clsx(css.item, profile.isBanned && css.itemBanned)}
                >
                  <div className={css.identity}>
                    <p className={css.name}>
                      {profile.displayName}
                      <span
                        className={clsx(
                          css.presence,
                          profile.isOnline ? css.presenceOnline : css.presenceOffline,
                        )}
                        title={
                          profile.isOnline
                            ? t("online")
                            : t("offline")
                        }
                      >
                        <span className={css.presenceDot} aria-hidden />
                        {profile.isOnline ? t("online") : t("offline")}
                      </span>
                      {isSelf ? (
                        <span className={css.you}>{t("you")}</span>
                      ) : null}
                      {profile.isBanned ? (
                        <span className={css.banned}>{t("bannedBadge")}</span>
                      ) : null}
                      {isProtected ? (
                        <span className={css.protected}>
                          {t("protectedBadge")}
                        </span>
                      ) : null}
                    </p>
                    <p className={css.login}>@{profile.login}</p>
                    <p className={css.meta}>
                      {t("roleMeta", { role: roleLabel(profile.role) })}
                      {" · "}
                      {t("lastLoginMeta", {
                        date: profile.lastLoginAt
                          ? formatDateTime(profile.lastLoginAt, locale)
                          : t("never"),
                      })}
                    </p>
                    <p className={css.meta}>
                      {t("lastSeenMeta", {
                        date: profile.lastSeenAt
                          ? formatDateTime(profile.lastSeenAt, locale)
                          : t("never"),
                      })}
                      {" · "}
                      {t("createdMeta", {
                        date: formatCreatedAt(profile.createdAt, locale),
                      })}
                    </p>
                  </div>

                  {canModerate ? (
                    <div className={css.actions}>
                      <form action={banAction}>
                        <input
                          type="hidden"
                          name="userId"
                          value={profile.id}
                        />
                        <input
                          type="hidden"
                          name="banned"
                          value={profile.isBanned ? "0" : "1"}
                        />
                        <button
                          type="submit"
                          className={clsx(
                            css.actionBtn,
                            profile.isBanned
                              ? css.actionUnban
                              : css.actionBan,
                          )}
                          disabled={pending}
                        >
                          {profile.isBanned ? t("unban") : t("ban")}
                        </button>
                      </form>
                      <form
                        action={deleteAction}
                        onSubmit={(event) => {
                          if (
                            !window.confirm(
                              t("deleteConfirm", { name: profile.displayName }),
                            )
                          ) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input
                          type="hidden"
                          name="userId"
                          value={profile.id}
                        />
                        <button
                          type="submit"
                          className={clsx(css.actionBtn, css.actionDelete)}
                          disabled={pending}
                        >
                          {t("delete")}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <p className={css.lockedHint}>
                      {isSelf
                        ? t("selfLocked")
                        : t("protectedLocked")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {flash.status === "success" ? (
          <p className={clsx(css.alert, css.alertSuccess)} role="status">
            {t(`success.${flash.action}`, { name: flash.displayName })}
          </p>
        ) : null}
        {flash.status === "error" ? (
          <p className={clsx(css.alert, css.alertError)} role="alert">
            {t(`errors.${flash.code}`)}
          </p>
        ) : null}
      </section>
    </div>
  );
}
