import React, { useState } from 'react';
import { ChatBubbleOvalLeftEllipsisIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

type FeedbackType = 'bug' | 'feature' | 'general';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    
    // フォームをリセット
    setMessage('');
    setEmail('');
    setFeedbackType('general');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Please enter your feedback message');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 実際の実装ではここでAPIエンドポイントにフィードバックを送信します
      // const response = await fetch('/api/feedback', { ... });
      
      // 成功したフリをする
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Thank you for your feedback!');
      handleClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed right-4 bottom-4 z-30 inline-flex items-center p-3 border border-transparent rounded-full shadow-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        aria-label="Send feedback"
      >
        <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 overflow-y-auto z-40" aria-labelledby="feedback-modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={handleClose}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="feedback-modal-title">
                  Send Feedback
                </h3>
                <button
                  onClick={handleClose}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="mt-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFeedbackType('bug')}
                      className={`py-2 px-4 text-sm font-medium rounded-md ${
                        feedbackType === 'bug'
                          ? 'bg-red-100 text-red-700 border-red-300 border'
                          : 'bg-gray-100 text-gray-700 border border-transparent hover:bg-gray-200'
                      }`}
                    >
                      Bug Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackType('feature')}
                      className={`py-2 px-4 text-sm font-medium rounded-md ${
                        feedbackType === 'feature'
                          ? 'bg-green-100 text-green-700 border-green-300 border'
                          : 'bg-gray-100 text-gray-700 border border-transparent hover:bg-gray-200'
                      }`}
                    >
                      Feature Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackType('general')}
                      className={`py-2 px-4 text-sm font-medium rounded-md ${
                        feedbackType === 'general'
                          ? 'bg-blue-100 text-blue-700 border-blue-300 border'
                          : 'bg-gray-100 text-gray-700 border border-transparent hover:bg-gray-200'
                      }`}
                    >
                      General
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Feedback
                  </label>
                  <textarea
                    id="feedback-message"
                    rows={4}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Please describe your feedback in detail..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                  ></textarea>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    id="feedback-email"
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="If you'd like us to follow up with you"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}