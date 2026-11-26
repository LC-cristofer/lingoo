import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { ProfileProvider, useProfile } from "@/components/nestoy/ProfileProvider";
import { PROFILE_KEY } from "@/domain/nestoy/profile";

const wrapper = ({ children }: { children: ReactNode }) => <ProfileProvider>{children}</ProfileProvider>;
const stored = () => JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "{}");

beforeEach(() => localStorage.clear());

describe("ProfileProvider.update", () => {
  it("answering age and English in the parents' area finishes the cadastro", () => {
    const { result } = renderHook(() => useProfile(), { wrapper });
    act(() => result.current.update({ name: "Ana" }));
    expect(result.current.profile.onboarding).toBe("pending");
    act(() => result.current.update({ age: 5 }));
    expect(result.current.profile.onboarding).toBe("pending");
    act(() => result.current.update({ english: "words" }));
    expect(result.current.profile.onboarding).toBe("done");
    expect(result.current.profile.createdAt).not.toBeNull();
    expect(stored().onboarding).toBe("done");
  });

  it("a skipped cadastro stays skipped", () => {
    const { result } = renderHook(() => useProfile(), { wrapper });
    act(() => result.current.update({ onboarding: "skipped" }));
    act(() => result.current.update({ age: 6, english: "none" }));
    expect(result.current.profile.onboarding).toBe("skipped");
  });
});
