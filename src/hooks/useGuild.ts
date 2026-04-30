import { useState, useEffect, useCallback } from "react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import type { Guild, GuildMember, GuildPost, GuildRole, GuildJoinRequest } from "@/types";

export interface AvailableGuild extends Guild {
  member_count: number;
  leader_name:      string | null;
  vice_leader_name: string | null;
}

export function useGuild(studentId: string, teacherId: string) {
  const [myGuild,         setMyGuild]         = useState<Guild | null>(null);
  const [members,         setMembers]         = useState<GuildMember[]>([]);
  const [posts,           setPosts]           = useState<GuildPost[]>([]);
  const [availableGuilds, setAvailableGuilds] = useState<AvailableGuild[]>([]);
  const [myRole,          setMyRole]          = useState<GuildRole | null>(null);
  const [isLoading,       setIsLoading]       = useState(true);
  const [pendingRequests, setPendingRequests] = useState<GuildJoinRequest[]>([]);
  const [myPendingRequest, setMyPendingRequest] = useState<GuildJoinRequest | null>(null);

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
    // List EVERY guild in the system (cross-teacher). The student picks any
    // one to send a join request to; the leader/vice-leader of that guild
    // approves or rejects.
    const { data: guildsData } = await supabaseStudent
      .from("guilds")
      .select("*")
      .order("level", { ascending: false });

    if (!guildsData) return;

    // One round trip for ALL leader/vice rows across the listed guilds.
    const guildIds = guildsData.map(g => g.id);
    const { data: leaderRows } = guildIds.length
      ? await supabaseStudent
          .from("guild_members")
          .select("guild_id, role, student:students(name, character_name)")
          .in("guild_id", guildIds)
          .in("role", ["lider", "vice_lider"])
      : { data: [] as Array<{
          guild_id: string;
          role: string;
          student: { name: string; character_name: string | null } | null;
        }> };

    const byGuild: Record<string, { leader: string | null; vice: string | null }> = {};
    (leaderRows || []).forEach((r: any) => {  // eslint-disable-line @typescript-eslint/no-explicit-any
      const display = r.student?.character_name || r.student?.name || null;
      const slot    = byGuild[r.guild_id] ??= { leader: null, vice: null };
      if (r.role === 'lider')      slot.leader = display;
      if (r.role === 'vice_lider') slot.vice   = display;
    });

    const guildsWithMeta = await Promise.all(
      guildsData.map(async (g) => {
        const { count } = await supabaseStudent
          .from("guild_members")
          .select("*", { count: 'exact', head: true })
          .eq("guild_id", g.id);
        return {
          ...g,
          member_count:     count ?? 0,
          leader_name:      byGuild[g.id]?.leader ?? null,
          vice_leader_name: byGuild[g.id]?.vice   ?? null,
        };
      })
    );
    setAvailableGuilds(guildsWithMeta as AvailableGuild[]);
  }, []);

  const loadPendingRequests = useCallback(async (guildId: string) => {
    const { data } = await supabaseStudent
      .from("guild_join_requests")
      .select("*, student:students(name, character_name, character_class, level)")
      .eq("guild_id", guildId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setPendingRequests((data || []) as unknown as GuildJoinRequest[]);
  }, []);

  const loadMyPendingRequest = useCallback(async () => {
    if (!studentId) return;
    const { data } = await supabaseStudent
      .from("guild_join_requests")
      .select("*")
      .eq("student_id", studentId)
      .eq("status", "pending")
      .maybeSingle();
    setMyPendingRequest((data as GuildJoinRequest | null) ?? null);
  }, [studentId]);

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
        setMyPendingRequest(null);

        const { data: membersData } = await supabaseStudent
          .from("guild_members")
          .select("*, student:students(id, name, character_name, character_class, level)")
          .eq("guild_id", guild.id)
          .order("joined_at");
        setMembers((membersData || []) as unknown as GuildMember[]);

        await loadPosts(guild.id);

        // Leaders / vice-leaders need to see pending requests.
        if (memberData.role === 'lider' || memberData.role === 'vice_lider') {
          await loadPendingRequests(guild.id);
        } else {
          setPendingRequests([]);
        }
      } else {
        setMyGuild(null);
        setMyRole(null);
        setMembers([]);
        setPosts([]);
        setPendingRequests([]);
        await loadAvailableGuilds();
        await loadMyPendingRequest();
      }
    } finally {
      setIsLoading(false);
    }
  }, [studentId, loadPosts, loadAvailableGuilds, loadPendingRequests, loadMyPendingRequest]);

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

  const requestJoinGuild = async (guildId: string) => {
    const { error } = await supabaseStudent.from("guild_join_requests").insert({
      guild_id:   guildId,
      student_id: studentId,
      status:     'pending',
    });
    if (error) throw error;
    await loadMyPendingRequest();
  };

  const cancelJoinRequest = async () => {
    if (!myPendingRequest) return;
    const { error } = await supabaseStudent
      .from("guild_join_requests")
      .update({ status: 'cancelled', resolved_at: new Date().toISOString() })
      .eq("id", myPendingRequest.id);
    if (error) throw error;
    setMyPendingRequest(null);
  };

  const respondJoinRequest = async (requestId: string, approve: boolean) => {
    const { error } = await supabaseStudent.rpc('respond_guild_join_request', {
      p_request_id: requestId,
      p_approve:    approve,
    });
    if (error) throw error;
    await loadMyGuild();  // refreshes members + pending list
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
    pendingRequests, myPendingRequest,
    createGuild, requestJoinGuild, cancelJoinRequest, respondJoinRequest,
    leaveGuild, kickMember, sendPost, loadMyGuild,
  };
}
