"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { DevSocialLink } from "./demoMembers";
import css from "./DevTeam.module.css";

export type DevTeamMemberCard = {
  id: string;
  name: string;
  role: string;
  socials: DevSocialLink[];
};

export type DevTeamService = {
  id: string;
  title: string;
  text: string;
};

export type DevTeamPanelLabels = {
  toggle: string;
  collapse: string;
  kicker: string;
  title: string;
  lead: string;
  socialLinkedin: string;
  socialTelegram: string;
  carouselAria: string;
  servicesTitle: string;
  servicesLead: string;
  formCta: string;
};

export type DevTeamPanelProps = {
  members: DevTeamMemberCard[];
  services: DevTeamService[];
  labels: DevTeamPanelLabels;
};

const AUTO_SPEED_PX_PER_SEC = 36;

function PseudoPhoto({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("uk") ?? "")
    .join("");

  return (
    <div className={css.photo} aria-hidden>
      <span className={css.photoInitials}>{initials || "∑"}</span>
    </div>
  );
}

function SocialIcon({ id }: { id: DevSocialLink["id"] }) {
  if (id === "telegram") {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <path
          fill="currentColor"
          d="M21.5 4.3 3.7 11.2c-1.2.5-1.2 1.1-.2 1.4l4.6 1.4 1.8 5.4c.2.7.4.9 1 .9.6 0 .9-.3 1.2-.6l2.7-2.6 4.6 3.4c.8.5 1.4.2 1.6-.8L23 5.5c.3-1.2-.4-1.7-1.5-1.2Zm-3.2 2.6-9.4 8.5-.4 3.1-1.9-5.9 11.7-5.7Z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path
        fill="currentColor"
        d="M6.5 9H3.7v11.3h2.8V9Zm-.1-3.9c-.9 0-1.6.7-1.6 1.6S5.5 8.3 6.4 8.3s1.6-.7 1.6-1.6-.7-1.6-1.6-1.6ZM20.3 14.2c0-3.1-1.7-5.2-4.4-5.2-2 0-2.9 1.1-3.4 1.9V9H9.7c0 .9 0 11.3 0 11.3h2.8v-6.3c0-.3 0-.7.1-1 .3-.7.9-1.5 2-1.5 1.4 0 2 1.1 2 2.6v6.2h2.8v-6.4Z"
      />
    </svg>
  );
}

function MemberCard({
  member,
  labels,
  titleId,
}: {
  member: DevTeamMemberCard;
  labels: DevTeamPanelLabels;
  titleId?: string;
}) {
  return (
    <article className={css.card} aria-labelledby={titleId}>
      <PseudoPhoto name={member.name} />
      <div className={css.cardBody}>
        <h3 id={titleId} className={css.name}>
          {member.name}
        </h3>
        <p className={css.role}>{member.role}</p>
        {member.socials.length > 0 ? (
          <ul className={css.socials}>
            {member.socials.map((social) => (
              <li key={social.id}>
                <a
                  className={css.socialLink}
                  href={social.href}
                  aria-label={
                    social.id === "telegram"
                      ? labels.socialTelegram
                      : labels.socialLinkedin
                  }
                  onClick={(event) => {
                    if (social.href === "#") event.preventDefault();
                  }}
                >
                  <SocialIcon id={social.id} />
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

function wrapOffset(offset: number, loopWidth: number): number {
  if (loopWidth <= 0) return offset;
  let next = offset % loopWidth;
  if (next > 0) next -= loopWidth;
  return next;
}

function DevTeamMarquee({
  members,
  labels,
  panelId,
}: {
  members: DevTeamMemberCard[];
  labels: DevTeamPanelLabels;
  panelId: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const reduceMotionRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const loopMembers = [...members, ...members];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = media.matches;
    const onChange = () => {
      reduceMotionRef.current = media.matches;
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      loopWidthRef.current = track.scrollWidth / 2;
      offsetRef.current = wrapOffset(offsetRef.current, loopWidthRef.current);
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (
        !draggingRef.current &&
        !reduceMotionRef.current &&
        loopWidthRef.current > 0
      ) {
        offsetRef.current = wrapOffset(
          offsetRef.current - AUTO_SPEED_PX_PER_SEC * dt,
          loopWidthRef.current,
        );
        track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [members.length]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("a, button")) return;

    draggingRef.current = true;
    movedRef.current = false;
    pointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || pointerIdRef.current !== event.pointerId) {
      return;
    }

    const delta = event.clientX - dragStartXRef.current;
    if (Math.abs(delta) > 4) movedRef.current = true;

    offsetRef.current = wrapOffset(
      dragStartOffsetRef.current + delta,
      loopWidthRef.current,
    );
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    }
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    draggingRef.current = false;
    pointerIdRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (!movedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    movedRef.current = false;
  }

  return (
    <div
      className={dragging ? `${css.marquee} ${css.marqueeDragging}` : css.marquee}
      aria-label={labels.carouselAria}
      role="region"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
    >
      <div className={css.marqueeViewport}>
        <ul ref={trackRef} className={css.marqueeTrack}>
          {loopMembers.map((member, index) => {
            const isClone = index >= members.length;
            return (
              <li
                key={`${member.id}-${index}`}
                className={css.marqueeItem}
                aria-hidden={isClone || undefined}
              >
                <MemberCard
                  member={member}
                  labels={labels}
                  titleId={
                    isClone ? undefined : `${panelId}-member-${member.id}`
                  }
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function DevTeamPanel({ members, services, labels }: DevTeamPanelProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();

  return (
    <div className={css.root}>
      <div className={css.toggleWrap}>
        <button
          type="button"
          className={css.toggle}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{open ? labels.collapse : labels.toggle}</span>
          <svg
            className={open ? css.chevronOpen : css.chevron}
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m6 9 6 6 6-6"
            />
          </svg>
        </button>
      </div>

      {open ? (
        <section id={panelId} className={css.panel} aria-labelledby={titleId}>
          <header className={css.head}>
            <p className={css.kicker}>{labels.kicker}</p>
            <h2 id={titleId} className={css.title}>
              {labels.title}
            </h2>
            <p className={css.lead}>{labels.lead}</p>
          </header>

          <div className={css.body}>
            {members.length > 0 ? (
              <DevTeamMarquee
                members={members}
                labels={labels}
                panelId={panelId}
              />
            ) : null}

            <aside
              className={css.openings}
              aria-labelledby={`${panelId}-services`}
            >
              <h3 id={`${panelId}-services`} className={css.openingsTitle}>
                {labels.servicesTitle}
              </h3>
              <p className={css.openingsLead}>{labels.servicesLead}</p>
              <ul className={css.openingsList}>
                {services.map((service) => (
                  <li key={service.id} className={css.openingCard}>
                    <h4 className={css.openingTitle}>{service.title}</h4>
                    <p className={css.openingText}>{service.text}</p>
                  </li>
                ))}
              </ul>
              <button type="button" className={css.formCta}>
                {labels.formCta}
              </button>
            </aside>
          </div>
        </section>
      ) : null}
    </div>
  );
}
