import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter,
  Card,
} from "@repo/ui/src/components/card";
import { Input } from "@repo/ui/src/components/input";
import { Textarea } from "@repo/ui/src/components/textarea";
import { Button } from "@repo/ui/src/components/button";
import { ArrowLeft, Plus, UploadCloud } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/src/components/form";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/src/components/popover";
import { RadioGroup, RadioGroupItem } from "@repo/ui/src/components/radio";
import { Label } from "@repo/ui/src/components/label";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

import DraftBadge from "./saving-badge";
import SavingBadge from "./saving-badge";
import Image from "next/image";
import { InfoTooltip, Tooltip, TooltipContent } from "@repo/ui/src/components";
import { Crystal } from "@repo/ui/src/components/icons";
import Spinner from "@repo/ui/src/components/spinner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import RemixBadge from "./remix-badge";
import { ModelSelect } from "./model-select";
import { ArchiveButton } from "./archive-button";
import { GenerateButton } from "./generate-button";

const formSchema = z.object({
  name: z.string().max(24),
  description: z.string().max(64),
  instructions: z.string().max(512),
  greetings: z.optional(z.string()),
  model: z.union([
    z.literal("mistral-7b-instruct"),
    z.literal("mixtral-8x7b-instruct"),
    z.literal("gpt-3.5-turbo-1106"),
    z.literal("gpt-4-1106-preview"),
    z.literal("pplx-7b-chat"),
    z.literal("pplx-7b-online"),
    z.literal("pplx-70b-chat"),
    z.literal("pplx-70b-online"),
    z.literal("mistral-small"),
    z.literal("mistral-medium"),
  ]),
});

export default function CharacterForm() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") as Id<"characters">;
  const remixId = searchParams.get("remixId") as Id<"characters">;
  const [characterId, setCharacterId] = useState<Id<"characters"> | undefined>(
    id,
  );
  const remixCharacter = useQuery(
    api.characters.get,
    remixId ? { id: remixId } : "skip",
  );
  const character = useQuery(
    api.characters.get,
    id ? { id } : characterId ? { id: characterId } : "skip",
  );
  const isEdit = searchParams.get("isEdit") || false;
  const router = useRouter();
  const {
    name = searchParams.get("name") || "",
    description = searchParams.get("description") || "",
    instructions = searchParams.get("instructions") || "",
    greetings = searchParams.get("greetings") || "",
    cardImageUrl = searchParams.get("cardImageUrl") || "",
    model = (searchParams.get("model") as any) || "gpt-4-1106-preview",
    isDraft = searchParams.get("isDraft") || true,
  } = character || remixCharacter || {};

  const upsert = useMutation(api.characters.upsert);
  const publish = useMutation(api.characters.publish);
  const generateImage = useMutation(api.characterCard.request);
  const generateInstruction = useMutation(api.characters.generateInstruction);
  const generateUploadUrl = useMutation(api.characters.generateUploadUrl);
  const [visibility, setVisibility] = useState("public");

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingInstructions, setIsGeneratingInstructions] =
    useState(false);

  const imageInput = useRef<HTMLInputElement>(null);
  const [openPopover, setOpenPopover] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name,
      description,
      instructions,
      greetings: Array.isArray(greetings) ? greetings[0] : greetings,
      model,
    },
  });

  useEffect(() => {
    form.reset({
      name,
      description,
      instructions,
      greetings: Array.isArray(greetings) ? greetings[0] : greetings,
      model,
    });
  }, [character, name, description, instructions, greetings, model]);

  useEffect(() => {
    cardImageUrl && setIsGeneratingImage(false);
  }, [cardImageUrl]);

  useEffect(() => {
    instructions && setIsGeneratingInstructions(false);
  }, [instructions]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { greetings, ...otherValues } = values;
    const character = await upsert({
      ...(characterId ? { id: characterId } : {}),
      greetings: [greetings as string],
      ...otherValues,
      ...(cardImageUrl ? { cardImageUrl } : {}),
      ...(remixId ? { remixId } : {}),
    });
    character && setCharacterId(character);
    return character;
  }

  async function handleUploadImage(uploadedImage: File) {
    const newCharacterId = await onSubmit(form.getValues());
    const validImageTypes = [
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!validImageTypes.includes(uploadedImage.type)) {
      toast.error(
        "Invalid file type. Please upload a valid image file (gif, jpeg, png)",
      );
      return;
    }
    if (uploadedImage.size > 5242880) {
      toast.error("File size should be less than 5MB");
      return;
    }
    const promise = generateUploadUrl()
      .then((postUrl) =>
        fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": uploadedImage!.type },
          body: uploadedImage,
        }),
      )
      .then((result) => result.json())
      .then(({ storageId }) =>
        upsert({
          ...(characterId
            ? { id: characterId }
            : newCharacterId
              ? { id: newCharacterId as Id<"characters"> }
              : {}),
          cardImageStorageId: storageId,
        }),
      );

    toast.promise(promise, {
      loading: "Uploading character card...",
      success: (character) => {
        character && setCharacterId(character);
        return `Character card has been uploaded.`;
      },
      error: (error) => {
        return error
          ? (error.data as { message: string }).message
          : "Unexpected error occurred";
      },
    });
  }

  const debouncedSubmitHandle = useDebouncedCallback(onSubmit, 1000);
  const isImageUploadDisabled =
    !form.getValues().name ||
    !form.getValues().description ||
    isGeneratingImage;
  const isInstructionGenerationDisabled =
    !form.getValues().name ||
    !form.getValues().description ||
    isGeneratingInstructions;
  return (
    <Card className="h-full w-full overflow-hidden rounded-b-none border-transparent shadow-none lg:border-border lg:shadow-xl">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <div className="flex items-center gap-2">
            <Link href="/my-characters">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            {isEdit ? "Edit Character" : "New Character"}
            {form.formState.isSubmitting ? (
              <SavingBadge />
            ) : form.formState.isDirty && isDraft ? (
              <DraftBadge />
            ) : null}
            {remixId && <RemixBadge />}
          </div>
          <div className="flex items-center gap-2">
            {characterId && <ArchiveButton characterId={characterId} />}
            {!cardImageUrl && isDraft && (
              <GenerateButton
                setCharacterId={setCharacterId}
                cardImageUrl={cardImageUrl}
                name={name}
              />
            )}
            <Popover
              open={openPopover}
              onOpenChange={() => setOpenPopover(!openPopover)}
            >
              <PopoverContent asChild>
                <div className="w-full rounded-lg bg-background p-4 sm:w-40">
                  <RadioGroup
                    defaultValue="public"
                    className="p-1"
                    value={visibility}
                    onValueChange={(value) => setVisibility(value)}
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      Publish to
                    </span>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label className="font-normal" htmlFor="public">
                        Public
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <Label className="font-normal" htmlFor="private">
                        Only me
                      </Label>
                    </div>
                  </RadioGroup>
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={async () => {
                        const newCharacterId = await onSubmit(form.getValues());
                        const charId = characterId
                          ? characterId
                          : (newCharacterId as Id<"characters">);
                        charId &&
                          (() => {
                            const promise = publish({
                              id: charId,
                              visibility: visibility as any,
                            });
                            toast.promise(promise, {
                              loading: "Publishing character...",
                              success: (data: any) => {
                                data
                                  ? router.push(`/character/${data}`)
                                  : router.back();
                                return `Character has been saved.`;
                              },
                              error: (error) => {
                                return error
                                  ? (error.data as { message: string }).message
                                  : "Unexpected error occurred";
                              },
                            });
                          })();
                      }}
                      className="flex h-7 w-full gap-1 text-xs"
                    >
                      <UploadCloud className="text-foreground-primary h-4 w-4" />
                      Publish
                    </Button>
                  </div>
                </div>
              </PopoverContent>
              <PopoverTrigger asChild>
                <Button
                  onClick={() => {
                    setOpenPopover(!openPopover);
                  }}
                >
                  Save
                </Button>
              </PopoverTrigger>
            </Popover>
          </div>
        </CardTitle>
        <CardDescription>Configure your character details.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="my-4 flex w-full flex-col items-center justify-center gap-4">
          <Label
            htmlFor="card"
            className="relative flex h-[350px] w-[200px] cursor-pointer flex-col items-center justify-center rounded border border-dashed duration-200 hover:-translate-y-1 hover:border-border hover:shadow-lg"
          >
            <Plus />
            Add character card
            <span className="text-xs text-muted-foreground">
              Best size: 1024x1792
            </span>
            {cardImageUrl && (
              <Image
                src={cardImageUrl}
                alt={"Preview of character card"}
                width={300}
                height={525}
                className="absolute h-full w-full rounded object-cover"
              />
            )}
          </Label>
          <Input
            id="card"
            type="file"
            accept="image/*"
            ref={imageInput}
            onChange={(event: any) => {
              handleUploadImage(event.target.files![0]);
            }}
            className="hidden"
          />
          <Tooltip
            content={
              isImageUploadDisabled
                ? "Write character name and description to generate character card."
                : "Generate character card using character name and description"
            }
          >
            <Button
              className="flex w-[200px] gap-1"
              disabled={isImageUploadDisabled}
              onClick={async () => {
                setIsGeneratingImage(true);
                const formValues = form.getValues();
                const newCharacterId = await onSubmit(formValues);
                await generateImage({
                  characterId: characterId
                    ? characterId
                    : (newCharacterId as Id<"characters">),
                  name: formValues.name ? formValues.name : name,
                  description: formValues.description
                    ? formValues.description
                    : description,
                });
              }}
            >
              {isGeneratingImage ? (
                <>
                  <Spinner />
                  Generating...
                </>
              ) : (
                <>
                  Generate
                  <Crystal className="h-4 w-4" /> x 75
                </>
              )}
            </Button>
          </Tooltip>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(debouncedSubmitHandle)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Name
                    <InfoTooltip
                      content={
                        <TooltipContent
                          title={
                            "Name used by the character in conversations and what other users will see if the character is public."
                          }
                        />
                      }
                    />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Name your character" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="greetings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Greeting
                    <InfoTooltip
                      content={
                        <TooltipContent
                          title={
                            "The first thing your Character will say when starting a new conversation. Greeting can have a large impact on chat."
                          }
                        />
                      }
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="The first message from character to user"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="flex items-center gap-1">
                      Instructions{" "}
                      <span className="text-muted-foreground">(optional)</span>
                      <InfoTooltip
                        content={
                          <TooltipContent
                            title={
                              "With Instructions, you can have the Character describe themselves (traits, history, example quotes, mannerisms, etc.) and specify the topics they prefer to talk about."
                            }
                          />
                        }
                      />
                    </FormLabel>
                    <Tooltip
                      content={
                        isInstructionGenerationDisabled
                          ? "Write character name and description to generate instruction"
                          : "Generate character instruction"
                      }
                    >
                      <Button
                        className="flex h-8 gap-1"
                        variant="ghost"
                        disabled={isInstructionGenerationDisabled}
                        onClick={async () => {
                          setIsGeneratingInstructions(true);
                          const formValues = form.getValues();
                          const newCharacterId = await onSubmit(formValues);
                          await generateInstruction({
                            characterId: characterId
                              ? characterId
                              : (newCharacterId as Id<"characters">),
                            name: formValues.name ? formValues.name : name,
                            description: formValues.description
                              ? formValues.description
                              : description,
                          });
                        }}
                      >
                        {isGeneratingInstructions ? (
                          <>
                            <Spinner />
                            Generating...
                          </>
                        ) : (
                          <>
                            Generate
                            <Crystal className="h-4 w-4" /> x 1
                          </>
                        )}
                      </Button>
                    </Tooltip>
                  </div>
                  <FormControl>
                    <Textarea
                      className="min-h-[100px]"
                      placeholder="What does this character do? How does they behave? What should they avoid doing?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Description{" "}
                    <span className="text-muted-foreground">(optional)</span>
                    <InfoTooltip
                      content={
                        <TooltipContent
                          title={
                            "Description is a brief way to describe the Character and scenario. It acts like a name in character listings."
                          }
                        />
                      }
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Add a short description about this character"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ModelSelect form={form} model={model} />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="pb-32"></CardFooter>
    </Card>
  );
}
