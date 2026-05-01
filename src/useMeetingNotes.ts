import { useState, useCallback, useEffect } from 'react';
import type { MeetingNote, MeetingType, TeamKey } from './actionSchema';

const STORAGE_KEY = 'studio_meeting_notes';

function generateId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

export function useMeetingNotes() {
  const [notes, setNotes] = useState<MeetingNote[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      console.warn('Could not persist meeting notes');
    }
  }, [notes]);

  const addNote = useCallback((type: MeetingType, date: string, team?: TeamKey): MeetingNote => {
    const note: MeetingNote = {
      id: generateId(),
      type,
      team,
      date,
      content: '',
      createdAt: now(),
      updatedAt: now(),
    };
    setNotes(prev => [note, ...prev]);
    return note;
  }, []);

  const updateNote = useCallback((id: string, content: string) => {
    setNotes(prev =>
      prev.map(n => n.id === id ? { ...n, content, updatedAt: now() } : n)
    );
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const notesFor = useCallback((type: MeetingType, team?: TeamKey): MeetingNote[] => {
    return notes
      .filter(n => n.type === type && n.team === team)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [notes]);

  return { notes, addNote, updateNote, removeNote, notesFor };
}
