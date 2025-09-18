import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import {
    HelmetState, HelmetType, DecalPrompt, StyleId, ActiveTab, FullViewResolution,
    FullViewAngleSpread, FullViewResult, initialHelmetState, initialDecalPrompt, FullViewAngle
} from './types';
import {
    fileToBase64, decalPromptToText, parsePromptText,
    getHelmetProfileInstructions, assembleFullViewCanvas
} from './utils';
import {
    HelmetUploader, Helmet2Target, DecalPromptBuilder,
    AdvancedOptions, ResultsDisplay
} from './components';


const App = () => {
  // State
  const [helmet1, setHelmet1] = useState<HelmetState>(initialHelmetState);
  const [helmet1Status, setHelmet1Status] = useState<'idle' | 'analyzing' | 'extracted' | 'error'>('idle');
  const [decalPromptEn, setDecalPromptEn] = useState<DecalPrompt>(initialDecalPrompt);
  const [decalPromptVi, setDecalPromptVi] = useState<DecalPrompt>(initialDecalPrompt);
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [promptLang, setPromptLang] = useState<'vi' | 'en'>('en');

  const [helmet2, setHelmet2] = useState<HelmetState>(initialHelmetState);
  const [result, setResult] = useState<string | null>(null);

  // Helmet 2 Type State
  const [helmet2Type, setHelmet2Type] = useState<HelmetType | null>(null);
  const [recommendedHelmetType, setRecommendedHelmetType] = useState<HelmetType | null>(null);
  const [detectedHelmetType, setDetectedHelmetType] = useState<HelmetType | null>(null);
  const [isHelmet2UserUploaded, setIsHelmet2UserUploaded] = useState(false);
  
  const [preserveFinishOption, setPreserveFinishOption] = useState(true);
  const [avoidZonesOption, setAvoidZonesOption] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isStyling, setIsStyling] = useState(false);
  const [isGeneratingFullView, setIsGeneratingFullView] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('single');
  
  // Full View State
  const [fullViewResult, setFullViewResult] = useState<FullViewResult>(null);
  const [fullViewResolution, setFullViewResolution] = useState<FullViewResolution>(2048);
  const [fullViewAngleSpread, setFullViewAngleSpread] = useState<FullViewAngleSpread>('standard');
  const [fullViewLighting, setFullViewLighting] = useState(true);
  const [fullViewPreserveFinish, setFullViewPreserveFinish] = useState(true);
  const [fullViewLockSeed, setFullViewLockSeed] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);


  // Style Pack State
  const [stylePackResult, setStylePackResult] = useState<string | null>(null);
  const styleCache = React.useRef<Record<string, string>>({});
  const [styleId, setStyleId] = useState<StyleId>('line-sketch');
  const [strength, setStrength] = useState(65);
  const [preserveFinish, setPreserveFinish] = useState(true);
  const [lockSeed, setLockSeed] = useState(false);


  // Gemini AI initialization
  const ai = useMemo(() => {
    if (!process.env.API_KEY) {
      setError("API key is missing. Please set the API_KEY environment variable.");
      return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }, []);
  
  const currentCacheKey = useMemo(() =>
    `${styleId}-${strength}-${preserveFinish}-${lockSeed}`,
    [styleId, strength, preserveFinish, lockSeed]
  );
  
  const isCached = useMemo(() =>
    Object.prototype.hasOwnProperty.call(styleCache.current, currentCacheKey),
    [currentCacheKey, styleCache]
  );

  const decalPromptSchema = {
    type: Type.OBJECT,
    properties: {
        theme: { type: Type.STRING, description: "The overall theme of the decal." },
        motifs: { type: Type.STRING, description: "Specific symbols, shapes, or imagery used." },
        flow: { type: Type.STRING, description: "How the patterns move across the helmet." },
        palette: { type: Type.STRING, description: "Main color palette in HEX codes." },
        density: { type: Type.STRING, description: "How dense or sparse the decal elements are." },
        finish: { type: Type.STRING, description: "Observed finish cues like gloss, matte, metallic flakes." },
        typography: { type: Type.STRING, description: "Any text, its style, and content." },
        mood: { type: Type.STRING, description: "Adjectives describing the style (e.g., aggressive, retro)." }
    },
    required: ['theme', 'motifs', 'flow', 'palette', 'density', 'finish', 'typography', 'mood']
  };

  const helmetGenerationPrompts: Record<HelmetType, string> = {
    'half-face': "Clean half-face motorcycle helmet shell, pure right side profile (yaw +90°), camera perpendicular to the helmet side, visor/strap visible on the right, no 3/4, no foreshortening, no mirroring, no branding, neutral black shell (#111), smooth gloss finish, accurate proportions, studio softbox on white sweep, centered, high-res product shot.",
    'open-face': "Open-face helmet shell, pure right side profile (yaw +90°), clean rim around the face opening, features on the right side visible, not three-quarter, no mirroring, no chin bar, no branding, neutral black (#111), gloss, studio softbox, white sweep, centered, high-res.",
    'fullface': "Full-face helmet with clear visor and chin-bar, pure right side profile (yaw +90°), right-side visor hinge clearly visible, not three-quarter, no mirroring, no logos, neutral black shell (#111), gloss, studio softbox, white sweep, centered, high-res.",
    'cross-mx': "Motocross helmet with peak (visor) and open face, pure right side profile (yaw +90°), peak orientation and side vents visible on the right, no goggles by default, not three-quarter, no mirroring, no branding, neutral black (#111), semi-matte, studio softbox, white sweep, centered, high-res."
  };


  useEffect(() => {
    if (activeTab === 'style' && !isStyling) {
      setStylePackResult(styleCache.current[currentCacheKey] || null);
    }
  }, [activeTab, currentCacheKey, isStyling]);


  const handleStartOver = () => {
    setHelmet1(initialHelmetState);
    setHelmet1Status('idle');
    setDecalPromptEn(initialDecalPrompt);
    setDecalPromptVi(initialDecalPrompt);
    setEditedPrompt('');
    setPromptLang('en');
    setHelmet2(initialHelmetState);
    setResult(null);
    setHelmet2Type(null);
    setRecommendedHelmetType(null);
    setDetectedHelmetType(null);
    setIsHelmet2UserUploaded(false);
    setPreserveFinishOption(true);
    setAvoidZonesOption(true);
    setIsLoading(false);
    setIsStyling(false);
    setIsGeneratingFullView(false);
    setLoadingText('');
    setError(null);
    setActiveTab('single');
    // Reset Full View
    setFullViewResult(null);
    setFullViewResolution(2048);
    setFullViewAngleSpread('standard');
    setFullViewLighting(true);
    setFullViewPreserveFinish(true);
    setFullViewLockSeed(false);
    setDuplicateWarning(false);
    // Reset Style Pack
    setStylePackResult(null);
    styleCache.current = {};
    setStyleId('line-sketch');
    setStrength(65);
    setPreserveFinish(true);
    setLockSeed(false);
  };
  
  const handleHelmet2TypeChange = (type: HelmetType) => {
    setHelmet2Type(type);
    const angleMap: Record<HelmetType, FullViewAngleSpread> = {
        'half-face': 'narrow',
        'open-face': 'narrow',
        'fullface': 'standard',
        'cross-mx': 'wide',
    };
    setFullViewAngleSpread(angleMap[type]);
  };

  const handleHelmet1Upload = useCallback(async (file: File) => {
    if (!ai) return;
    handleStartOver(); // Reset everything on new upload
    setHelmet1({ file, previewUrl: URL.createObjectURL(file) });
    setHelmet1Status('analyzing');
    setIsLoading(true);
    setLoadingText('Analyzing decal from Helmet 1...');
    
    try {
      const { mimeType, data } = await fileToBase64(file);
      const imagePart = { inlineData: { mimeType, data } };
      
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: { parts: [
              imagePart,
              { text: "Analyze the decal on this helmet. Describe it in detail for replication in both English (en) and Vietnamese (vi). Also, classify the helmet type from one of the following: 'half-face', 'open-face', 'fullface', 'cross-mx'. Provide a confidence score for this classification from 0.0 to 1.0. Output only a JSON object with 'en', 'vi', 'helmetType', and 'helmetTypeConfidence' keys." }
          ]},
          config: {
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      en: decalPromptSchema,
                      vi: decalPromptSchema,
                      helmetType: { type: Type.STRING, description: "One of 'half-face', 'open-face', 'fullface', 'cross-mx'." },
                      helmetTypeConfidence: { type: Type.NUMBER, description: "Confidence score from 0.0 to 1.0." }
                  },
                  required: ['en', 'vi', 'helmetType', 'helmetTypeConfidence']
              }
          }
      });
      
      const jsonResponse = JSON.parse(response.text);
      setDecalPromptEn(jsonResponse.en);
      setDecalPromptVi(jsonResponse.vi);
      if (jsonResponse.helmetTypeConfidence >= 0.6) {
        const recommendedType = jsonResponse.helmetType as HelmetType;
        setRecommendedHelmetType(recommendedType);
        handleHelmet2TypeChange(recommendedType); // Auto-select the type
      }
      setEditedPrompt(decalPromptToText(jsonResponse.en, 'en', preserveFinishOption, avoidZonesOption));
      setHelmet1Status('extracted');
    } catch (e) {
      console.error(e);
      setError("Could not analyze decal. Please try another image.");
      setHelmet1Status('error');
    } finally {
      setIsLoading(false);
    }
  }, [ai, preserveFinishOption, avoidZonesOption]);

  const handleReloadPrompt = useCallback(async () => {
    if (!ai || !helmet1.file) return;

    setHelmet1Status('analyzing');
    setIsLoading(true);
    setLoadingText('Re-analyzing decal...');
    setError(null);
    setRecommendedHelmetType(null);

    try {
      const { mimeType, data } = await fileToBase64(helmet1.file);
      const imagePart = { inlineData: { mimeType, data } };
      
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
           contents: { parts: [
              imagePart,
              { text: "Analyze the decal on this helmet. Describe it in detail for replication in both English (en) and Vietnamese (vi). Also, classify the helmet type from one of the following: 'half-face', 'open-face', 'fullface', 'cross-mx'. Provide a confidence score for this classification from 0.0 to 1.0. Output only a JSON object with 'en', 'vi', 'helmetType', and 'helmetTypeConfidence' keys." }
          ]},
          config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    en: decalPromptSchema,
                    vi: decalPromptSchema,
                    helmetType: { type: Type.STRING, description: "One of 'half-face', 'open-face', 'fullface', 'cross-mx'." },
                    helmetTypeConfidence: { type: Type.NUMBER, description: "Confidence score from 0.0 to 1.0." }
                },
                required: ['en', 'vi', 'helmetType', 'helmetTypeConfidence']
            }
          }
      });
      
      const jsonResponse = JSON.parse(response.text);
      setDecalPromptEn(jsonResponse.en);
      setDecalPromptVi(jsonResponse.vi);
      if (jsonResponse.helmetTypeConfidence >= 0.6) {
        const recommendedType = jsonResponse.helmetType as HelmetType;
        setRecommendedHelmetType(recommendedType);
        handleHelmet2TypeChange(recommendedType); // Auto-select the type
      }
      const newPromptText = decalPromptToText(promptLang === 'en' ? jsonResponse.en : jsonResponse.vi, promptLang, preserveFinishOption, avoidZonesOption);
      setEditedPrompt(newPromptText);
      setHelmet1Status('extracted');
    } catch (e) {
      console.error(e);
      setError("Could not re-analyze decal. Please try again.");
      setHelmet1Status('error');
    } finally {
      setIsLoading(false);
    }
  }, [ai, helmet1.file, promptLang, preserveFinishOption, avoidZonesOption]);
  
  const detectHelmetType = async (file: File): Promise<HelmetType | null> => {
      if (!ai) return null;
      try {
        const { mimeType, data } = await fileToBase64(file);
        const imagePart = { inlineData: { mimeType, data } };
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, { text: "Classify the type of this helmet. Choose from: 'half-face', 'open-face', 'fullface', 'cross-mx'. Return a JSON object with one key: 'helmetType'." }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.OBJECT, properties: { helmetType: { type: Type.STRING } } }
            }
        });
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.helmetType;
      } catch (e) {
          console.error("Helmet type detection failed:", e);
          return null;
      }
  };

  const handleHelmet2Upload = useCallback(async (file: File) => {
    setHelmet2({ file, previewUrl: URL.createObjectURL(file) });
    setIsHelmet2UserUploaded(true);
    setResult(null);
    setFullViewResult(null);
    setStylePackResult(null);
    styleCache.current = {};
    setActiveTab('single');
    setDetectedHelmetType(null); // Clear previous detection

    const detected = await detectHelmetType(file);
    if (detected) {
        setDetectedHelmetType(detected);
        handleHelmet2TypeChange(detected); // Auto-apply profile
    }
  }, []);

  const handleClearHelmet2 = () => {
    setHelmet2(initialHelmetState);
    setDetectedHelmetType(null);
    setIsHelmet2UserUploaded(false);
  };
  
  const handleApplyDecal = useCallback(async () => {
    if (!ai || (!helmet2.file && !helmet2Type) || !editedPrompt) {
        setError("Please ensure Helmet 1 is analyzed and a Helmet 2 type is selected or an image is uploaded.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setFullViewResult(null);
    setStylePackResult(null);
    styleCache.current = {};
    setActiveTab('single');
    
    try {
        let targetHelmetFile = helmet2.file;

        // Stage 1: Generate a target helmet if it's missing or was previously generated by the AI
        if ((!targetHelmetFile || !isHelmet2UserUploaded) && helmet2Type) {
            setLoadingText('Generating target helmet...');
            const generationPrompt = helmetGenerationPrompts[helmet2Type];
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [{ text: generationPrompt }] },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
            });

            const imageResponsePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
            if (!imageResponsePart?.inlineData) throw new Error("Could not generate a target helmet image.");

            const blob = await (await fetch(`data:${imageResponsePart.inlineData.mimeType};base64,${imageResponsePart.inlineData.data}`)).blob();
            targetHelmetFile = new File([blob], "generated_helmet.png", { type: imageResponsePart.inlineData.mimeType });
            setHelmet2({ file: targetHelmetFile, previewUrl: URL.createObjectURL(targetHelmetFile) });
            setIsHelmet2UserUploaded(false); // Mark as AI-generated
        }
        
        if (!targetHelmetFile) throw new Error("Target helmet file is missing.");

        // Stage 2: Apply the decal
        setLoadingText('Applying decal to Helmet 2...');
        const { mimeType, data } = await fileToBase64(targetHelmetFile);
        const imagePart = { inlineData: { data, mimeType } };
        
        let finalPromptForApi = decalPromptToText(parsePromptText(editedPrompt), promptLang, preserveFinishOption, avoidZonesOption);
        
        // Use detected type for user uploads, and selected type for generated helmets.
        const instructionType = isHelmet2UserUploaded ? detectedHelmetType : helmet2Type;
        finalPromptForApi += getHelmetProfileInstructions(instructionType, promptLang);

        const textPart = { text: `Apply a new decal to this helmet based on the following description. Do NOT change the helmet's shape, material, or background. Only add the decal. \n\nPROMPT: ${finalPromptForApi}` };
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [ imagePart, textPart ]},
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imageResponsePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
        if (imageResponsePart?.inlineData) {
            const resultMimeType = imageResponsePart.inlineData.mimeType;
            const resultData = imageResponsePart.inlineData.data;
            setResult(`data:${resultMimeType};base64,${resultData}`);
        } else {
             throw new Error("API did not return an image.");
        }
    } catch (e) {
        console.error(e);
        setError("Could not apply decal. Please try again.");
    } finally {
        setIsLoading(false);
    }
  }, [ai, helmet2.file, helmet2Type, editedPrompt, promptLang, preserveFinishOption, avoidZonesOption, detectedHelmetType, helmetGenerationPrompts, isHelmet2UserUploaded]);
  
  const handleGenerateFullView = useCallback(async (isFixingDuplicates = false) => {
    if (!ai || !result) return;
    
    let finalPromptForApi = decalPromptToText(parsePromptText(editedPrompt), promptLang, preserveFinishOption, avoidZonesOption);
    finalPromptForApi += getHelmetProfileInstructions(detectedHelmetType || helmet2Type, promptLang);
    if (!finalPromptForApi) return;

    setIsGeneratingFullView(true);
    setLoadingText('Calibrating pose...');
    setError(null);
    if (!isFixingDuplicates) {
        setFullViewResult(null);
        setDuplicateWarning(false);
    }

    try {
        const baseResultData = result.split(',')[1];
        const baseResultMimeType = result.split(';')[0].split(':')[1];
        const baseImagePart = { inlineData: { data: baseResultData, mimeType: baseResultMimeType } };
        
        let views: Partial<Record<'front' | 'left' | 'right' | 'back', FullViewAngle>> = {};
        
        const generateView = async (targetAngle: number, viewName: string, sourceView: FullViewAngle, seed?: number) => {
            setLoadingText(`Generating ${viewName} view...`);
            const sourceImagePart = { inlineData: { data: sourceView.src.split(',')[1], mimeType: sourceView.src.split(';')[0].split(':')[1] } };
            const textPart = { text: `Using the provided image (at approx ${sourceView.angle}° yaw) as a reference for the helmet's shape, material finish, and lighting, re-render the helmet at a precise ${targetAngle} degree yaw. It is CRITICAL that you apply the decal described in the following text prompt, ensuring it maps consistently as if rotating from the source image. Do not change the helmet shape or background.

DECAL PROMPT TO APPLY:
${finalPromptForApi}` };

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [sourceImagePart, textPart] },
                config: { 
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                    ...(seed && { seed })
                },
            });

            const imageResponsePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
            if (imageResponsePart?.inlineData) {
                return { src: `data:${imageResponsePart.inlineData.mimeType};base64,${imageResponsePart.inlineData.data}`, angle: targetAngle };
            }
            throw new Error(`API did not return an image for ${viewName} view.`);
        };
        
        const baseSeed = fullViewLockSeed ? 1337 : Math.floor(Math.random() * 10000);
        
        if (isFixingDuplicates && fullViewResult) {
             views = { front: fullViewResult.front, right: fullViewResult.right, left: fullViewResult.left, back: fullViewResult.back };
        } else {
             // STAGE 1: Pose Estimation
            const calibrationResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts: [baseImagePart, { text: `Analyze the orientation of the helmet. Estimate its yaw angle in degrees. Return a JSON object with one key: "yaw" (e.g., 0 for front, 45 for 3/4 right, -90 for left profile).` }] },
                config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { yaw: { type: Type.NUMBER } } } }
            });
            const { yaw: initialYaw } = JSON.parse(calibrationResponse.text);

            // STAGE 2: Smart Slotting
            const initialAngle = { src: result, angle: Math.round(initialYaw) };
            if (Math.abs(initialYaw) <= 20) views.front = initialAngle;
            else if (initialYaw > 20) views.right = initialAngle;
            else if (initialYaw < -20) views.left = initialAngle;
            else views.back = initialAngle;
        }

        const angleMap = { narrow: 30, standard: 40, wide: 60 };
        const delta = angleMap[fullViewAngleSpread];
        
        // STAGE 3: Generate missing views
        if (!views.front) views.front = await generateView(0, 'canonical front', Object.values(views)[0]!, isFixingDuplicates ? undefined : baseSeed + 1);
        if (!views.right) views.right = await generateView(delta, 'right', views.front, isFixingDuplicates ? undefined : baseSeed + 2);
        if (!views.left) views.left = await generateView(-delta, 'left', views.front, isFixingDuplicates ? undefined : baseSeed + 3);
        if (!views.back) views.back = await generateView(180, 'back', views.left, isFixingDuplicates ? undefined : baseSeed + 4);

        const finalViews = views as Required<typeof views>;

        // STAGE 4: Verification
        setLoadingText('Verifying views...');
        // FIX: Correctly construct the multi-part request to avoid type inference errors.
        // The original code created an array of one type and then pushed a different type, causing a TypeScript error.
        // This creates a new array with both image and text parts together, allowing TypeScript to infer the correct union type.
        const verificationImageParts = Object.values(finalViews).map(v => ({
            inlineData: { data: v.src.split(',')[1], mimeType: v.src.split(';')[0].split(':')[1] }
        }));
        
        const verificationResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [
                ...verificationImageParts,
                { text: "Here are four images of a helmet from different angles. Are any two or more of these images visually identical or near-identical duplicates (ignoring minor generative noise)? Answer with only a JSON object with a single boolean key: `hasDuplicates`." }
            ] },
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.OBJECT, properties: { hasDuplicates: { type: Type.BOOLEAN } } }
            }
        });
        const { hasDuplicates } = JSON.parse(verificationResponse.text);
        setDuplicateWarning(hasDuplicates);

        // STAGE 5: Assemble and display
        const grid = await assembleFullViewCanvas(finalViews, fullViewResolution);
        setFullViewResult({ ...finalViews, grid });

    } catch (e) {
        console.error(e);
        setError("Could not generate full view. Please try again.");
    } finally {
        setIsGeneratingFullView(false);
    }
  }, [ai, result, editedPrompt, promptLang, preserveFinishOption, avoidZonesOption, fullViewAngleSpread, fullViewResolution, detectedHelmetType, helmet2Type, fullViewLockSeed, fullViewResult]);
  
  const handleFixDuplicates = useCallback(() => {
    handleGenerateFullView(true);
  }, [handleGenerateFullView]);

  const handleDownloadSingleView = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = `roc_single_view.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    
  const handleDownloadFullViewSquare = () => {
    if (!fullViewResult?.grid) return;
    const link = document.createElement('a');
    link.href = fullViewResult.grid;
    link.download = `roc_fullview_square_${fullViewResolution}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFullViewIndividuals = () => {
    if (!fullViewResult) return;
    Object.entries(fullViewResult).forEach(([key, value]) => {
        if (key !== 'grid' && value && typeof value === 'object' && 'src' in value) {
             const link = document.createElement('a');
             link.href = value.src;
             link.download = `roc_fullview_${key}_${value.angle}deg.png`;
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
        }
    });
  };

  const handleDownloadStylePack = () => {
    if (!stylePackResult) return;
    const link = document.createElement('a');
    link.href = stylePackResult;
    link.download = `roc_style_${styleId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

 const handleApplyStyle = useCallback(async ({ forceReload = false }: { forceReload?: boolean } = {}) => {
    if (!ai || !result) return;

    if (!forceReload && isCached) {
      setStylePackResult(styleCache.current[currentCacheKey]);
      return;
    }

    setIsStyling(true);
    setLoadingText('Applying style...');
    setError(null);

    const stylePrompts: Record<StyleId, string> = {
      'line-sketch': "Re-render the following image as a clean line sketch. Use pencil strokes and light cross-hatching for shading. The decal should appear as darker, defined lines. Do not change the helmet shape. The helmet's visor and vents must not be drawn over.",
      'watercolor': "Transform the image into a watercolor painting. The decal's shapes and colors should be present but with soft, bleeding edges. Use a subtle paper grain texture. Do not let the watercolor bleed onto the helmet's visor or vents.",
      'marker': "Re-render this image in a Copic marker illustration style. Use characteristic marker streaks and blend 2-3 shades for depth. Give it a thin, clean outline. The helmet's highlights should be simulated with a 'colorless blender' effect.",
      'neon': "Give this image a neon/cyberpunk aesthetic. Add subtle neon rim lighting around the helmet's silhouette and accentuate the decal edges with a gentle glow. Increase local contrast. Do not add any text or advertisements. The glow should not cover the visor or vents."
    };
    
    let dynamicPrompt = stylePrompts[styleId];
    dynamicPrompt += `\n\nStyle configuration: The style strength should be ${strength} out of 100. `;
    dynamicPrompt += preserveFinish
        ? "It is crucial to PRESERVE THE ORIGINAL FINISH (e.g., gloss or matte) of the helmet. Only alter the artistic rendering, not the material properties like reflections."
        : "You have creative freedom to change the helmet's finish to match the artistic style (e.g., making it look like it's painted on paper).";


    try {
        const base64Data = result.split(',')[1];
        const mimeType = result.split(';')[0].split(':')[1];
        const imagePart = { inlineData: { data: base64Data, mimeType } };
        const textPart = { text: dynamicPrompt };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imageResponsePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
        if (imageResponsePart?.inlineData) {
            const resultMimeType = imageResponsePart.inlineData.mimeType;
            const resultData = imageResponsePart.inlineData.data;
            const newResult = `data:${resultMimeType};base64,${resultData}`;
            setStylePackResult(newResult);
            styleCache.current[currentCacheKey] = newResult;
        } else {
            throw new Error("API did not return a styled image.");
        }
    } catch (e) {
        console.error(e);
        setError('Could not apply style.');
    } finally {
        setIsStyling(false);
    }
  }, [ai, result, styleId, strength, preserveFinish, currentCacheKey, isCached]);

  const handleApplyOrReloadStyle = useCallback(() => {
    handleApplyStyle({ forceReload: isCached });
  }, [handleApplyStyle, isCached]);

  const handlePromptChange = (newText: string) => {
    setEditedPrompt(newText);
    const currentPromptObject = parsePromptText(newText);
    if (promptLang === 'en') {
      setDecalPromptEn(currentPromptObject);
    } else {
      setDecalPromptVi(currentPromptObject);
    }
  };

  const handleTranslate = () => {
    const newLang = promptLang === 'vi' ? 'en' : 'vi';
    setPromptLang(newLang);
    
    const currentPromptObject = parsePromptText(editedPrompt);
    let targetPromptObject: DecalPrompt;
    
    if (promptLang === 'en') {
        setDecalPromptEn(currentPromptObject);
        targetPromptObject = decalPromptVi;
    } else {
        setDecalPromptVi(currentPromptObject);
        targetPromptObject = decalPromptEn;
    }
    
    setEditedPrompt(decalPromptToText(targetPromptObject, newLang, preserveFinishOption, avoidZonesOption));
  };
  
  const isReadyForApply = helmet1Status === 'extracted' && (helmet2.file || helmet2Type);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Decal Transfer Studio</h1>
        <p>Automatically "reads" the decal from Helmet 1 and applies that decal to Helmet 2.</p>
      </header>
      
      {error && <div className="error-message" onClick={() => setError(null)}>{error}</div>}

      <main className="main-content">
        <section className="column">
          <HelmetUploader
            id="helmet1"
            title="1. Helmet 1 (Decal Source)"
            onFileSelect={handleHelmet1Upload}
            previewUrl={helmet1.previewUrl}
            status={helmet1Status}
            onReload={handleReloadPrompt}
          />
          <Helmet2Target
            helmet={helmet2}
            onFileSelect={handleHelmet2Upload}
            onClear={handleClearHelmet2}
            selectedType={helmet2Type}
            recommendedType={recommendedHelmetType}
            lockedType={detectedHelmetType}
            onTypeChange={handleHelmet2TypeChange}
          />
        </section>

        <section className="column">
          <DecalPromptBuilder 
            prompt={editedPrompt}
            onPromptChange={handlePromptChange}
            onTranslate={handleTranslate}
            activeLang={promptLang}
          />
          <AdvancedOptions 
             preserveFinish={preserveFinishOption}
             setPreserveFinish={setPreserveFinishOption}
             avoidZones={avoidZonesOption}
             setAvoidZones={setAvoidZonesOption}
          />
          <button 
            className="cta-button" 
            onClick={() => handleApplyDecal()}
            disabled={!isReadyForApply || isLoading || isStyling || isGeneratingFullView}
            aria-busy={isLoading || isStyling || isGeneratingFullView}
          >
            {isLoading ? 'Processing...' : 'Apply Decal'}
          </button>
        </section>

        <section className="column">
          <ResultsDisplay
              result={result}
              isLoading={isLoading}
              loadingText={loadingText}
              onStartOver={handleStartOver}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              // Download Handlers
              onDownloadSingleView={handleDownloadSingleView}
              onDownloadFullViewSquare={handleDownloadFullViewSquare}
              onDownloadFullViewIndividuals={handleDownloadFullViewIndividuals}
              onDownloadStylePack={handleDownloadStylePack}
              // Full View
              fullViewResult={fullViewResult}
              isGeneratingFullView={isGeneratingFullView}
              fullViewResolution={fullViewResolution} setFullViewResolution={setFullViewResolution}
              fullViewAngleSpread={fullViewAngleSpread} setFullViewAngleSpread={setFullViewAngleSpread}
              fullViewLighting={fullViewLighting} setFullViewLighting={setFullViewLighting}
              fullViewPreserveFinish={fullViewPreserveFinish} setFullViewPreserveFinish={setFullViewPreserveFinish}
              fullViewLockSeed={fullViewLockSeed} setFullViewLockSeed={setFullViewLockSeed}
              onGenerateFullView={() => handleGenerateFullView(false)}
              duplicateWarning={duplicateWarning}
              onFixDuplicates={handleFixDuplicates}
              // Style Pack
              stylePackResult={stylePackResult}
              isStyling={isStyling}
              styleId={styleId} onStyleIdChange={setStyleId}
              strength={strength} onStrengthChange={setStrength}
              preserveFinish={preserveFinish} onPreserveFinishChange={setPreserveFinish}
              lockSeed={lockSeed} onLockSeedChange={setLockSeed}
              onApplyOrReload={handleApplyOrReloadStyle}
              isCached={isCached}
          />
        </section>
      </main>
    </div>
  );
};

export default App;