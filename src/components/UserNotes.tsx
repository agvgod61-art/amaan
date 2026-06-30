import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db, collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "../lib/firebase";
import { FileText, Plus, Trash2, Loader2 } from "lucide-react";

export default function UserNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "notes"),
        where("userId", "==", user.id || user.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Sort in memory by createdAt descending
        fetchedNotes.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
        });

        setNotes(fetchedNotes);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching notes:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Notes listener skipped/errored", e);
      setLoading(false);
    }
  }, [user]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !user) return;

    setIsAdding(true);
    try {
      await addDoc(collection(db, "notes"), {
        userId: user.id || user.uid,
        content: newNote.trim(),
        createdAt: serverTimestamp(),
      });
      setNewNote("");
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await deleteDoc(doc(db, "notes", id));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white/5 border border-white/10 p-8 space-y-6">
      <div>
        <h3 className="text-white text-sm font-bold uppercase tracking-tight flex items-center gap-2">
          <FileText size={16} className="text-brand-accent" />
          My Data Notes
        </h3>
        <p className="text-[10px] text-brand-metallic uppercase tracking-widest mt-1">
          Keep your personal riding notes, sizes, and preferences here.
        </p>
      </div>

      <form onSubmit={handleAddNote} className="flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Type a new note..."
          className="flex-1 bg-black border border-white/10 p-4 text-white text-sm focus:border-brand-accent outline-none transition-all"
        />
        <button
          type="submit"
          disabled={isAdding || !newNote.trim()}
          className="bg-brand-accent text-white px-6 py-4 text-xs font-bold uppercase tracking-widest hover:bg-brand-accent/80 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Add
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin text-brand-metallic" />
        </div>
      ) : notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {notes.map((note) => (
            <div key={note.id} className="bg-black border border-white/5 p-5 relative group">
              <p className="text-white text-sm whitespace-pre-wrap pr-8 leading-relaxed font-mono">
                {note.content}
              </p>
              <div className="mt-4 text-[9px] text-brand-metallic uppercase tracking-widest">
                {note.createdAt?.toDate ? new Date(note.createdAt.toDate()).toLocaleDateString() : 'Just now'}
              </div>
              <button
                onClick={() => handleDeleteNote(note.id)}
                className="absolute top-4 right-4 text-brand-metallic hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete Note"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-black/50 border border-white/5 p-8 text-center">
          <p className="text-xs text-brand-metallic uppercase tracking-widest">No notes added yet.</p>
        </div>
      )}
    </div>
  );
}
