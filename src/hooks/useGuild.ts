import { useState, useEffect, useCallback } from "react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import type { Guild, GuildMember, GuildPost, GuildRole } from "@/types";

export function useGuild(studentId: string, teacherId: string) {
  const [myGuild,         setMyGuild]         = useState<Guild | null>(null);
  const [members,         setMembers]         = useState<GuildMember[]>([]);
  const [posts,           setPosts]           = useState<GuildPost[]>([]);
  const [availableGuilds, setAvailableGuilds] = useState<(Guild & { member_count: number })[]>([]);
  const [myRole,          setMyRole]          = useState<GuildRole | null>(null);
  const [isLoading,       setIsLoading]       = useState(true);

  const loadPosts = useCallback(async (guildId: string) => {
    const { data } = await supabaseStudent
      .from("guild_posts")
      .select("*, student:students(name, character_name)")
      .eq("guild_id", guildId)
      .order("created_at", { ascending: false })
      .limit(30);
    setPosts((data || []) as unknown as GuildPost[]);
  }, []);

  const loadAvailableGuilds = useCallback(async () => {
    if (!teacherId) return;
    const { data: guildsData } = await supabaseStudent
      .from("guilds")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("level", { ascending: false });

    if (!guildsData) return;

    const guildsWithCount = await Promise.all(
      guildsData.map(async (g) => {
        const { count } = await supabaseStudent
          .from("guild_members")
          .select("*", { count: 'exact', head: true })
          .eq("guild_id", g.id);
        return { ...g, member_count: count ?? 0 };
      })
    );
    setAvailableGuilds(guildsWithCount as (Guild & { member_count: number })[]);
  }, [teacherId]);

  const loadMyGuild = useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const { data: memberData } = await supabaseStudent
        .from("guild_members")
        .select("*, guild:guilds(*)")
        .eq("student_id", studentId)
        .maybeSingle();

      if (memberData?.guild) {
        const guild = memberData.guild as Guild;
        setMyGuild(guild);
        setMyRole(memberData.role as GuildRole);

        const { data: membersData } = await supabaseStudent
          .from("guild_members")
          .select("*, student:students(id, name, character_name, character_class, level)")
          .eq("guild_id", guild.id)
          .order("joined_at");
        setMembers((membersData || []) as unknown as GuildMember[]);

        await loadPosts(guild.id);
      } else {
        setMyGuild(null);
        setMyRole(null);
        setMembers([]);
        setPosts([]);
        await loadAvailableGuilds();
      }
    } finally {
      setIsLoading(false);
    }
  }, [studentId, loadPosts, loadAvailableGuilds]);

  useEffect(() => {
    loadMyGuild();
  }, [loadMyGuild]);

  // Realtime subscription for posts
  useEffect(() => {
    if (!myGuild) return;
    const channel = supabaseStudent
      .channel(`guild-posts-${myGuild.id}`)
      .on('postgres_changes' as never, {
        event: 'INSERT', schema: 'public', table: 'guild_posts',
        filter: `guild_id=eq.${myGuild.id}`,
      }, () => { loadPosts(myGuild.id); })
      .subscribe();
    return () => { supabaseStudent.removeChannel(channel); };
  }, [myGuild?.id, loadPosts]);

  const createGuild = async (
    name:        string,
    description?: string,
    emblem?:      string,
    emblemColor?: string,
  ) => {
    const { data: guild, error } = await supabaseStudent
      .from("guilds")
      .insert({
        teacher_id:   teacherId,
        name:         name.trim(),
        description:  description?.trim() || null,
        emblem:       emblem      ?? 'shield',
        emblem_color: emblemColor ?? '#825ADB',
        level:        1,
        xp:           0,
        max_members:  6,
      })
      .select()
      .single();

    if (error || !guild) throw error;

    await supabaseStudent.from("guild_members").insert({
      guild_id:   guild.id,
      student_id: studentId,
      role:       'lider',
    });

    await loadMyGuild();
  };

  const joinGuild = async (guildId: string) => {
    const { error } = await supabaseStudent.from("guild_members").insert({
      guild_id:   guildId,
      student_id: studentId,
      role:       'soldado',
    });
    if (error) throw error;
    await loadMyGuild();
  };

  const kickMember = async (guildMemberId: string) => {
    if (!myGuild) return;
    await supabaseStudent
      .from("guild_members")
      .delete()
      .eq("id", guildMemberId)
      .eq("guild_id", myGuild.id);
    await loadMyGuild();
  };

  const leaveGuild = async () => {
    if (!myGuild) return;

    await supabaseStudent
      .from("guild_members")
      .delete()
      .eq("guild_id", myGuild.id)
      .eq("student_id", studentId);

    // Transfer leadership to next member if I was the leader
    if (myRole === 'lider' && members.length > 1) {
      const next = members.find(m => m.student_id !== studentId);
      if (next) {
        await supabaseStudent
          .from("guild_members")
          .update({ role: 'lider' })
          .eq("id", next.id);
      }
    }

    // Delete guild if I was the only member
    if (members.length <= 1) {
      await supabaseStudent.from("guilds").delete().eq("id", myGuild.id);
    }

    setMyGuild(null);
    setMyRole(null);
    setMembers([]);
    setPosts([]);
    await loadAvailableGuilds();
  };

  const sendPost = async (content: string) => {
    if (!myGuild || !content.trim()) return;
    await supabaseStudent.from("guild_posts").insert({
      guild_id:  myGuild.id,
      student_id: studentId,
      content:   content.trim(),
      post_type: 'message',
    });
    await loadPosts(myGuild.id);
  };

  return {
    myGuild, members, posts, availableGuilds, myRole, isLoading,
    createGuild, joinGuild, leaveGuild, kickMember, sendPost, loadMyGuild,
  };
}
