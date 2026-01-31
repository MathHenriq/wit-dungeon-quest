import { useState, useEffect } from "react";
import { Student, ChallengeRequest, ItemRequest } from "@/types/game";

const STORAGE_KEY = "wit_dungeon_student";
const CHALLENGE_REQUESTS_KEY = "wit_dungeon_challenge_requests";
const ITEM_REQUESTS_KEY = "wit_dungeon_item_requests";

const defaultStudent: Student = {
  name: "",
  className: "",
  characterName: "",
  coins: 50, // Starting coins for demo
  level: 1,
};

export function useStudent() {
  const [student, setStudent] = useState<Student | null>(null);
  const [challengeRequests, setChallengeRequests] = useState<ChallengeRequest[]>([]);
  const [itemRequests, setItemRequests] = useState<ItemRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedChallenges = localStorage.getItem(CHALLENGE_REQUESTS_KEY);
    const storedItems = localStorage.getItem(ITEM_REQUESTS_KEY);

    if (stored) {
      try {
        setStudent(JSON.parse(stored));
      } catch {
        setStudent(null);
      }
    }

    if (storedChallenges) {
      try {
        setChallengeRequests(JSON.parse(storedChallenges));
      } catch {
        setChallengeRequests([]);
      }
    }

    if (storedItems) {
      try {
        setItemRequests(JSON.parse(storedItems));
      } catch {
        setItemRequests([]);
      }
    }

    setIsLoading(false);
  }, []);

  const saveStudent = (data: Omit<Student, "coins" | "level">) => {
    const newStudent: Student = {
      ...defaultStudent,
      ...data,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStudent));
    setStudent(newStudent);
  };

  const requestChallenge = (challengeId: string, challengeTitle: string) => {
    const request: ChallengeRequest = {
      challengeId,
      challengeTitle,
      timestamp: new Date(),
    };
    const updated = [...challengeRequests, request];
    setChallengeRequests(updated);
    localStorage.setItem(CHALLENGE_REQUESTS_KEY, JSON.stringify(updated));
  };

  const requestItem = (itemId: string, itemName: string) => {
    const request: ItemRequest = {
      itemId,
      itemName,
      timestamp: new Date(),
    };
    const updated = [...itemRequests, request];
    setItemRequests(updated);
    localStorage.setItem(ITEM_REQUESTS_KEY, JSON.stringify(updated));
  };

  const hasChallengeRequest = (challengeId: string) => {
    return challengeRequests.some((r) => r.challengeId === challengeId);
  };

  const hasItemRequest = (itemId: string) => {
    return itemRequests.some((r) => r.itemId === itemId);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CHALLENGE_REQUESTS_KEY);
    localStorage.removeItem(ITEM_REQUESTS_KEY);
    setStudent(null);
    setChallengeRequests([]);
    setItemRequests([]);
  };

  return {
    student,
    isLoading,
    saveStudent,
    requestChallenge,
    requestItem,
    hasChallengeRequest,
    hasItemRequest,
    logout,
  };
}
