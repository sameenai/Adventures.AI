import { prisma } from "@/lib/db/prisma";
import { DIFFICULTY_MAP } from "@/lib/difficulty-map";
import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const adventure = await prisma.adventure.findUnique({
    where: { id, published: true },
    select: {
      title: true,
      location: true,
      country: true,
      category: true,
      difficulty: true,
      durationDays: true,
      coverImageUrl: true,
    },
  });

  if (!adventure) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1c1917",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#78716c",
          fontSize: 32,
          fontFamily: "sans-serif",
        }}
      >
        Adventure not found
      </div>,
    );
  }

  const difficulty = DIFFICULTY_MAP.get(adventure.difficulty as never);
  const category = adventure.category.replace(/_/g, " ");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#1c1917",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background image */}
      <img
        src={adventure.coverImageUrl}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.35,
        }}
      />

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(28,25,23,0.95) 0%, rgba(28,25,23,0.5) 60%, transparent 100%)",
          display: "flex",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Category badge */}
        <span
          style={{
            color: "#f59e0b",
            fontSize: 18,
            fontFamily: "sans-serif",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
          }}
        >
          {category}
        </span>

        {/* Title */}
        <div
          style={{
            color: "#f5f5f4",
            fontSize: 72,
            fontFamily: "sans-serif",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {adventure.title}
        </div>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginTop: 8,
            color: "#a8a29e",
            fontSize: 22,
            fontFamily: "sans-serif",
          }}
        >
          <span>
            {adventure.location}, {adventure.country}
          </span>
          <span style={{ color: "#57534e" }}>·</span>
          <span
            style={{
              color: difficulty?.color?.replace("text-", "").replace("-", "#") ?? "#a8a29e",
            }}
          >
            {difficulty?.label ?? adventure.difficulty}
          </span>
          <span style={{ color: "#57534e" }}>·</span>
          <span>
            {adventure.durationDays} day{adventure.durationDays !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Basecamp brand */}
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 60,
          color: "#f59e0b",
          fontSize: 20,
          fontFamily: "sans-serif",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        Basecamp
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
