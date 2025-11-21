import React, { useState, useEffect } from 'react';
import { User, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const ProfileSettings = () => {
    const { user, updateUserMetadata } = useAuth();
    const [avatars, setAvatars] = useState([]);
    const [loadingAvatars, setLoadingAvatars] = useState(true);
    const [selectedAvatar, setSelectedAvatar] = useState(user?.user_metadata?.avatar_url || null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchAvatars = async () => {
            setLoadingAvatars(true);
            const { data, error } = await supabase.from('profile_avatars').select('url');
            if (error) {
                console.error('Error fetching avatars:', error);
            } else {
                setAvatars(data.map(a => a.url));
            }
            setLoadingAvatars(false);
        };
        fetchAvatars();
    }, []);

    const handleAvatarSelect = async (avatarUrl) => {
        if (isSaving || avatarUrl === selectedAvatar) return;
        
        setIsSaving(true);
        setSelectedAvatar(avatarUrl);
        await updateUserMetadata({ avatar_url: avatarUrl });
        setIsSaving(false);
    };

    const getInitials = (email) => {
        if (!email) return '?';
        return email.split('@')[0].charAt(0).toUpperCase();
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                <User className="mr-2 h-5 w-5 text-blue-500" />
                Perfil do Usuário
            </h2>
            <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 text-3xl">
                    <AvatarImage src={selectedAvatar} alt="Avatar do usuário" />
                    <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{user?.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Escolha seu avatar abaixo:</p>
                </div>
            </div>

            <div className="mt-6">
                {loadingAvatars ? (
                    <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                        {avatars.map((url, index) => (
                            <button
                                key={index}
                                onClick={() => handleAvatarSelect(url)}
                                className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                                disabled={isSaving}
                            >
                                <Avatar className="h-12 w-12 transition-transform transform hover:scale-110">
                                    <AvatarImage src={url} alt={`Avatar ${index + 1}`} />
                                    <AvatarFallback>A</AvatarFallback>
                                </Avatar>
                                {selectedAvatar === url && (
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                        {isSaving ? (
                                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                                        ) : (
                                            <CheckCircle className="h-6 w-6 text-white" />
                                        )}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSettings;