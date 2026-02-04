import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RewardConfig {
  id: string;
  teacher_id: string;
  name: string;
  icon: string;
  unit_label_singular: string;
  unit_label_plural: string;
}

const DEFAULT_REWARD: Omit<RewardConfig, "id" | "teacher_id"> = {
  name: "Moedas",
  icon: "🪙",
  unit_label_singular: "moeda",
  unit_label_plural: "moedas",
};

export function useTeacherReward(teacherId: string | null) {
  const [rewardConfig, setRewardConfig] = useState<RewardConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (teacherId) {
      loadRewardConfig(teacherId);
    } else {
      setRewardConfig(null);
    }
  }, [teacherId]);

  const loadRewardConfig = async (tid: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("teacher_rewards")
        .select("*")
        .eq("teacher_id", tid)
        .maybeSingle();

      if (error) {
        console.error("Error loading reward config:", error);
      }

      if (data) {
        setRewardConfig(data as RewardConfig);
      } else {
        // Return default config (not saved yet)
        setRewardConfig({
          id: "",
          teacher_id: tid,
          ...DEFAULT_REWARD,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveRewardConfig = async (config: Omit<RewardConfig, "id" | "teacher_id">) => {
    if (!teacherId) return { error: new Error("No teacher ID") };

    // Check if config exists
    const { data: existing } = await supabase
      .from("teacher_rewards")
      .select("id")
      .eq("teacher_id", teacherId)
      .maybeSingle();

    let result;
    if (existing) {
      // Update
      result = await supabase
        .from("teacher_rewards")
        .update({
          name: config.name,
          icon: config.icon,
          unit_label_singular: config.unit_label_singular,
          unit_label_plural: config.unit_label_plural,
        })
        .eq("teacher_id", teacherId)
        .select()
        .single();
    } else {
      // Insert
      result = await supabase
        .from("teacher_rewards")
        .insert({
          teacher_id: teacherId,
          name: config.name,
          icon: config.icon,
          unit_label_singular: config.unit_label_singular,
          unit_label_plural: config.unit_label_plural,
        })
        .select()
        .single();
    }

    if (result.error) {
      return { error: result.error };
    }

    setRewardConfig(result.data as RewardConfig);
    return { error: null };
  };

  const getRewardLabel = (amount: number) => {
    const config = rewardConfig || { ...DEFAULT_REWARD, id: "", teacher_id: "" };
    return amount === 1 ? config.unit_label_singular : config.unit_label_plural;
  };

  const getRewardName = () => {
    return rewardConfig?.name || DEFAULT_REWARD.name;
  };

  const getRewardIcon = () => {
    return rewardConfig?.icon || DEFAULT_REWARD.icon;
  };

  return {
    rewardConfig,
    isLoading,
    saveRewardConfig,
    getRewardLabel,
    getRewardName,
    getRewardIcon,
    DEFAULT_REWARD,
  };
}
