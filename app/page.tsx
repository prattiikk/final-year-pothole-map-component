"use client"
import dynamic from "next/dynamic";

const PotholeMap = dynamic(() => import("../components/map"), { ssr: false });

export default function Home() {
  return <PotholeMap />;
}