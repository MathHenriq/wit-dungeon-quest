import React from 'react';
import type { GuildMission } from './guild-types';

interface GuildMissionCardProps {
  mission: GuildMission;
}

const DIFF_LABELS = { easy: 'Fácil', normal: 'Normal', hard: 'Difícil' };

export function GuildMissionCard({ mission }: GuildMissionCardProps) {
  const prog = Math.min(mission.progress, 100);

  return (
    <div className={`guild-mission-card${mission.completed ? ' guild-mission-card--completed' : ''}`}>
      <div className="guild-mission-card__header">
        <div className="guild-mission-card__name">{mission.title}</div>
        <div className={`guild-mission-card__diff guild-mission-card__diff--${mission.difficulty}`}>
          {DIFF_LABELS[mission.difficulty]}
        </div>
      </div>

      <div className="guild-mission-card__desc">{mission.description}</div>

      <div className="guild-mission-card__prog">
        <div className="guild-mission-card__prog-bar">
          <div
            className={`guild-mission-card__prog-fill guild-mission-card__prog-fill--${mission.completed ? 'completed' : 'active'}`}
            style={{ width: `${prog}%` }}
          />
        </div>
        <div className="guild-mission-card__prog-text">
          <span>{mission.current} / {mission.required}</span>
          <span>{prog}%</span>
        </div>
      </div>

      <div className="guild-mission-card__footer">
        <div className="guild-mission-card__rewards">
          <span className="guild-mission-card__reward guild-mission-card__reward--xp">
            +{mission.reward_xp} XP
          </span>
          <span className="guild-mission-card__reward guild-mission-card__reward--coins">
            +{mission.reward_coins} Moedas
          </span>
        </div>
        <div className="guild-mission-card__deadline">
          {mission.completed ? 'Concluída' : `${mission.deadline} restantes`}
        </div>
      </div>
    </div>
  );
}
