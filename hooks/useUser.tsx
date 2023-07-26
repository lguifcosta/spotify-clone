import { User } from "@supabase/auth-helpers-nextjs";
import { Subscription, UserDetails } from "@/types";
import { createContext, useContext, useEffect, useState } from "react";
import { useSessionContext, useUser as useSupaUser } from "@supabase/auth-helpers-react";

type UserConstextType = {
    accessToken: string | null;
    user: User | null;
    userDetails: UserDetails | null;
    isLoading: boolean;
    subscription: Subscription | null;
}

export const UserContext = createContext<UserConstextType | undefined>(
    undefined
);

export interface Props {
    [propName: string]: any;
};

export const MyUserContextProvider = (props: Props) => {
    const {
        session,
        isLoading : isLoadingUser,
        supabaseClient: supabase
    } = useSessionContext();
    const user = useSupaUser();
    const accessToken = session?.access_token ?? null;
    const [isLoadingData, setIsLoadtingData] = useState(false);
    const [userDetails , setUserDetails] = useState<UserDetails | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);

    const getUserDetails = () => supabase.from('users').select('*').single();
    const getSubscription = () => 
    supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trailing', 'active'])
    .single();

    useEffect(()=> {
        if(user && !isLoadingData && !userDetails && !subscription){
            setIsLoadtingData(true)

            Promise.allSettled([getUserDetails(), getSubscription()]).then(
                (results)=>{
                    const userDetailsPromisse = results[0];
                    const subscriptionPromisse = results[1];

                    if ( userDetailsPromisse.status == "fulfilled"){
                        setUserDetails(userDetailsPromisse.value.data as UserDetails);
                    }
                    if (subscriptionPromisse.status == "fulfilled"){
                        setSubscription(subscriptionPromisse.value.data as Subscription)
                    }

                    setIsLoadtingData(false);
                }
            );
        }else if(!user && !isLoadingUser && !isLoadingData){
            setUserDetails(null);
            setSubscription(null);
        }
    },[user,isLoadingUser]);
    const value = {
        accessToken,
        user,
        userDetails,
        isLoading: isLoadingData || isLoadingUser,
        subscription
    };

    return <UserContext.Provider value={value} {...props}/>
}

export const useUser = ()=> {
    const context = useContext(UserContext);
    if(context === undefined){
        throw new Error('useUser must be used within a MyUserContextProvider');
    }
    return context
}