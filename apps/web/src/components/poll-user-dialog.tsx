import React, { useState } from 'react';
import { useRoomStore } from '../store/room-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { HelpCircle } from 'lucide-react';
import axios from 'axios';

export function PollUserDialog() {
  const { activePoll, setActivePoll, userId } = useRoomStore();
  const [submitting, setSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!activePoll) return null;

  const handleSubmit = async () => {
    if (!selectedOption || !userId) return;
    setSubmitting(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/polls/${activePoll.id}/answers`, {
        userId,
        optionId: selectedOption,
      });
      // Once submitted successfully, we can close the poll for this user
      setActivePoll(null);
    } catch (error) {
      console.error('Failed to submit poll answer', error);
      alert('حدث خطأ أثناء إرسال الإجابة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!activePoll} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.5)]" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <HelpCircle className="w-6 h-6" />
            <DialogTitle className="text-xl font-bold">سؤال من مسؤول الاجتماع</DialogTitle>
          </div>
          <DialogDescription className="text-right text-slate-300 text-lg">
            {activePoll.question}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 mt-2">
          {activePoll.options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`p-4 rounded-xl border-2 text-right transition-all duration-300 flex items-center justify-between group ${
                selectedOption === option.id
                  ? 'border-blue-500 bg-blue-900/30 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                  : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-blue-400/50 hover:bg-slate-800 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]'
              }`}
            >
              <span className="font-medium text-lg">{option.text}</span>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedOption === option.id ? 'border-blue-400' : 'border-slate-500 group-hover:border-blue-400/50'
              }`}>
                {selectedOption === option.id && <div className="w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]" />}
              </div>
            </button>
          ))}
        </div>

        <DialogFooter className="mr-auto sm:justify-start pt-2">
          <Button 
            disabled={!selectedOption || submitting} 
            onClick={handleSubmit}
            className={`w-full font-bold h-14 text-xl rounded-xl transition-all duration-300 ${
              !selectedOption || submitting
                ? 'bg-slate-800 text-slate-500'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transform hover:-translate-y-0.5'
            }`}
          >
            {submitting ? 'جاري الإرسال...' : 'تأكيد الإجابة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
