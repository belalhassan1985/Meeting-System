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
      <DialogContent className="sm:max-w-[425px] " hideCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <HelpCircle className="w-6 h-6" />
            <DialogTitle className="text-xl font-bold">سؤال من مسؤول الاجتماع</DialogTitle>
          </div>
          <DialogDescription className="text-right text-gray-300 text-lg">
            {activePoll.question}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 mt-2">
          {activePoll.options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`p-4 rounded-xl border-2 text-right transition-all flex items-center justify-between ${
                selectedOption === option.id
                  ? 'border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/20'
                  : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
              }`}
            >
              <span className="font-medium">{option.text}</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedOption === option.id ? 'border-blue-500' : 'border-gray-500'
              }`}>
                {selectedOption === option.id && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
              </div>
            </button>
          ))}
        </div>

        <DialogFooter className="mr-auto sm:justify-start">
          <Button 
            disabled={!selectedOption || submitting} 
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-lg rounded-xl"
          >
            {submitting ? 'جاري الإرسال...' : 'تأكيد الإجابة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
