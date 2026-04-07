import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRoomStore } from '../store/room-store';
import { HelpCircle, Plus, Trash2, LayoutList, BarChart, Download } from 'lucide-react';
import { Button } from './ui/button';

export function PollSidebar() {
  const { roomId, userId, activePoll, pollResults } = useRoomStore();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', 'لا أعرف']);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (roomId) {
      fetchHistory();
    }
  }, [roomId, activePoll]); // refetch when activePoll changes to get latest results too

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}/polls`);
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    const validOptions = options.filter(o => o.trim() !== '');
    if (!question.trim() || validOptions.length < 2) {
      alert('يجب إدخال سؤال وخيارين على الأقل');
      return;
    }
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}/polls`, {
        question,
        options: validOptions,
        adminId: userId,
      });
      setQuestion('');
      setOptions(['', '', 'لا أعرف']);
      setView('list');
      fetchHistory();
    } catch (err) {
      alert('حدث خطأ أثناء إنشاء السؤال');
    }
  };

  const updateOption = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index] = val;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const exportReport = (poll: any) => {
    // Generate CSV
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + "الخيار,عدد الأصوات\n" 
      + poll.options.map((opt: any) => `${opt.text},${poll.results?.[opt.id] || 0}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `poll_report_${poll.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          إدارة الأسئلة والتصويت
        </h3>
      </div>

      <div className="flex gap-2 mb-4 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setView('list')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-1 transition ${view === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <LayoutList className="w-4 h-4" />
          السجل
        </button>
        <button
          onClick={() => setView('create')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-1 transition ${view === 'create' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Plus className="w-4 h-4" />
          إنشاء جديد
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {view === 'create' && (
          <div className="bg-gray-800 p-4 rounded-lg space-y-4 shadow-lg border border-gray-700">
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-medium">نص السؤال</label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white h-20 resize-none text-right placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                placeholder="اكتب سؤالك هنا..."
                dir="rtl"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-300 font-medium">الخيارات</label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-md p-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    placeholder={`الخيار ${i + 1}`}
                    dir="rtl"
                  />
                  <button onClick={() => removeOption(i)} className="text-red-500 hover:text-red-400 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addOption} className="w-full border-dashed border-gray-600 text-gray-300 hover:text-white mt-2">
                <Plus className="w-4 h-4 ml-2" /> إضافي خيار آخر
              </Button>
            </div>

            <Button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 mt-4 rounded-md">
              نشر السؤال للجميع
            </Button>
          </div>
        )}

        {view === 'list' && (
          <div className="space-y-4">
            {activePoll && (
              <div className="bg-blue-900/20 border border-blue-500 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400 mb-2 font-bold">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  سؤال نشط حالياً
                </div>
                <h4 className="text-white font-medium mb-3">{activePoll.question}</h4>
                <div className="space-y-2">
                  {activePoll.options.map(opt => {
                    const count = pollResults?.results?.[opt.id] || 0;
                    const total = Object.values(pollResults?.results || {}).reduce((a: any, b: any) => a + b, 0) as number;
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    
                    return (
                      <div key={opt.id} className="relative">
                        <div className="flex justify-between text-sm text-gray-300 mb-1 z-10 relative px-2">
                          <span>{opt.text}</span>
                          <span className="font-bold">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-md h-7 overflow-hidden relative">
                          <div 
                            className="absolute top-0 left-0 h-full bg-blue-600/50 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <h4 className="text-gray-400 font-medium text-sm border-b border-gray-700 pb-2 mt-4">السجل (الأسئلة السابقة)</h4>
            {history.filter(h => h.id !== activePoll?.id).length === 0 ? (
              <p className="text-gray-500 text-center text-sm py-4">لا يوجد أسئلة سابقة</p>
            ) : (
              history.filter(h => h.id !== activePoll?.id).map((poll) => (
                <div key={poll.id} className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
                  <h4 className="text-gray-200 font-medium text-sm mb-3">{poll.question}</h4>
                  <div className="space-y-1.5 mb-3">
                    {poll.options.map((opt: any) => {
                      const count = poll.results?.[opt.id] || 0;
                      return (
                        <div key={opt.id} className="flex justify-between text-xs text-gray-400 bg-gray-900/50 p-1.5 rounded">
                          <span className="truncate ml-2">{opt.text}</span>
                          <span className="font-bold text-gray-300 shrink-0">{count} أصوات</span>
                        </div>
                      );
                    })}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => exportReport(poll)} className="w-full text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 text-xs gap-1 h-8">
                    <Download className="w-3 h-3" />
                    استخراج تقرير (CSV)
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
