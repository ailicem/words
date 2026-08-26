import type { GetServerSideProps } from "next";
import { getSessionUser, hasAnyAdmin } from "@/lib/server/auth";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const sessionUser = await getSessionUser(ctx.req);
  if (sessionUser) {
    return { redirect: { destination: "/books", permanent: false } };
  }
  const hasAdmin = await hasAnyAdmin();
  return {
    redirect: {
      destination: hasAdmin ? "/signin" : "/signup",
      permanent: false,
    },
  };
};

export default function IndexPage() {
  return null;
}