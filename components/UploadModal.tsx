"use client";

import uniqid from "uniqid"
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";

import { useSupabaseClient } from "@supabase/auth-helpers-react";
import useUploadModal from "@/hooks/useUploadModal"
import { useUser } from "@/hooks/useUser";

import Modal from "./Modal"
import Input from "./Input";
import Button from "./Button";

const UploadModal = ()=>{
    const [isLoading, setIsLoading] = useState(false)
    const uploadModal = useUploadModal()
    const {user} = useUser()
    const supabaseClient = useSupabaseClient()
    const router = useRouter()

    const { register,handleSubmit,reset } = useForm<FieldValues>({
        defaultValues:{
            author: '',
            title: '',
            song:null,
            image:null
        }
    })

    const onChange = (open: boolean )=>{
        if(!open){
            reset()
           uploadModal.onClose() 
        }}
    
    const onSubmit: SubmitHandler<FieldValues> = async (values)=>{
       try{
        setIsLoading(true)

        const imageFile = values.image?.[0]
        const songFile = values.song?.[0]
        
        if(!user || !imageFile || !songFile){
            toast.error('missing fields')
            return;
        }

        const uniqueId = uniqid()


        //song upload
        const { 
            data: songData,
            error: songError
         }= await supabaseClient.storage.from('songs').upload(`song-${values.title}-${uniqueId}`, songFile,{
            cacheControl: '3600',
            upsert:false
         })
         if(songError){
            setIsLoading(false)
            return toast.error('Failed to upload song')
         }
         //image upload 
         const { 
            data: imageData,
            error: imageError
         }= await supabaseClient.storage.from('images').upload(`image-${values.title}-${uniqueId}`, imageFile,{
            cacheControl: '3600',
            upsert:false
         })
         if(imageError){
            setIsLoading(false)
            return toast.error('Failed to upload image')
         }

         //create record
         const {
            error:supabaseError
         }= await supabaseClient
         .from('songs')
         .insert({
            user_id: user.id,
            title: values.title,
            author: values.author,
            image_path: imageData.path,
            song_path: songData.path
         });
         console.log(values.title,values.author)

         if(supabaseError){
            setIsLoading(false)
            return toast.error(supabaseError.message)
         }

         router.refresh()
         setIsLoading(false)
         toast.success('Song created')
         reset()
         uploadModal.onClose()

       }catch (error){
        toast.error("something went wrong")
       }finally{setIsLoading(false)}
    }
    return (
        <Modal title="Add a song"
        description="Upload a mp3 file"
        isOpen={uploadModal.isOpen}
        onChange={onChange}>

        <form 
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        >
            <Input
            id="title"
            disabled={isLoading}
            {...register('title',{required:true})}
            placeholder="song title"
            />
            <Input
            id="author"
            disabled={isLoading}
            {...register('author',{required:true})}
            placeholder="song author"
            />
            <div>
                <div className="bp-1">
                    Select a song file
                </div>
            <Input
            id="song"
            type="file"
            accept=".mp3"
            disabled={isLoading}
            {...register('song',{required:true})}
            />
            </div>
            <div>
                <div className="bp-1">
                    Select an image
                </div>
            <Input
            id="image"
            type="file"
            accept="image/*"
            disabled={isLoading}
            {...register('image',{required:true})}
            />
            </div>
            <Button disabled={isLoading} type="submit">
                Create
            </Button>
        </form>
        </Modal>
    )
}

export default UploadModal