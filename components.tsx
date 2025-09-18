
import React, { useRef, useMemo } from 'react';
import { HelmetState, HelmetType, StyleId, ActiveTab, FullViewResolution, FullViewAngleSpread, FullViewResult } from './types';
import { UploadIcon, TranslateIcon, CopyIcon, XCircleIcon, LockIcon, BackIcon } from './icons';

// --- UI Components ---

export const Spinner = ({ text }: { text: string }) => (
  <div className="loading-overlay">
    <div className="spinner"></div>
    <p className="loading-text">{text}</p>
  </div>
);

export const HelmetUploader = ({
  id, title, onFileSelect, previewUrl, status, onReload, onClear
}: { id: string; title: string; onFileSelect: (file: File) => void; previewUrl: string | null; status?: 'idle' | 'analyzing' | 'extracted' | 'error'; onReload?: () => void; onClear?: () => void; }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const statusMap = {
    analyzing: { text: "⏳ Analyzing...", className: "analyzing" },
    extracted: { text: "✅ Extracted", className: "extracted" },
    error: { text: "❗ Error", className: "error" },
  };

  return (
    <div>
      <h2>{title}</h2>
      <div
        className="upload-zone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input type="file" accept="image/*" ref={inputRef} onChange={handleChange} style={{ display: 'none' }} id={id} />
        {previewUrl ? (
          <div className="preview-wrapper">
            <img src={previewUrl} alt="Helmet preview" className="image-preview" />
            {onClear && (
              <button className="clear-preview-button" onClick={(e) => { e.stopPropagation(); onClear(); }} title="Clear image">
                <XCircleIcon />
              </button>
            )}
          </div>
        ) : (
          <div className="upload-prompt">
            <UploadIcon />
            <strong>Drag & drop or click to upload</strong>
            <p>PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
      {status && status !== 'idle' && (
        <div className="status-container">
            <div className={`status-chip ${statusMap[status].className}`}>
              {statusMap[status].text}
            </div>
            {onReload && (status === 'extracted' || status === 'error') && (
                <button
                    className="secondary-action-button"
                    onClick={(e) => { e.stopPropagation(); onReload?.(); }}
                    title="Reload Prompt"
                >
                    Reload Prompt
                </button>
            )}
        </div>
      )}
    </div>
  );
};

export const HelmetTypeSelector = ({
    selectedType, recommendedType, lockedType, onSelectType
} : {
    selectedType: HelmetType | null;
    recommendedType: HelmetType | null;
    lockedType: HelmetType | null;
    onSelectType: (type: HelmetType) => void;
}) => {
    const types: { id: HelmetType; label: string; }[] = [
        { id: 'half-face', label: 'Half-face' },
        { id: 'open-face', label: 'Open-face' },
        { id: 'fullface', label: 'Fullface' },
        { id: 'cross-mx', label: 'Cross/MX' },
    ];

    return (
        <div className="helmet-type-selector-container">
            <div className="helmet-type-selector">
                {types.map(({ id, label }) => {
                    const isSelected = lockedType ? lockedType === id : selectedType === id;
                    const isRecommended = recommendedType === id && !lockedType;
                    const isDisabled = !!lockedType;
                    
                    let className = 'helmet-type-button';
                    if (isSelected) className += ' selected';
                    if (isRecommended) className += ' recommended';
                    
                    return (
                        <button 
                            key={id} 
                            className={className} 
                            onClick={() => onSelectType(id)} 
                            disabled={isDisabled}
                            title={isDisabled ? `Type locked to ${lockedType}` : `Select ${label}`}
                        >
                            <span>{label}</span>
                            {isRecommended && <span className="recommend-badge">Recommended</span>}
                        </button>
                    )
                })}
            </div>
            {lockedType && (
                 <div className="locked-chip">
                    <LockIcon /> Locked: {types.find(t => t.id === lockedType)?.label}
                </div>
            )}
        </div>
    );
};

export const Helmet2Target = ({
    helmet, onFileSelect, onClear,
    selectedType, recommendedType, lockedType, onTypeChange
} : {
    helmet: HelmetState;
    onFileSelect: (file: File) => void;
    onClear: () => void;
    selectedType: HelmetType | null;
    recommendedType: HelmetType | null;
    lockedType: HelmetType | null;
    onTypeChange: (type: HelmetType) => void;
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div>
            <h2>2. Helmet 2 (Target)</h2>
            <HelmetTypeSelector
                selectedType={selectedType}
                recommendedType={recommendedType}
                lockedType={lockedType}
                onSelectType={onTypeChange}
            />
            <div
                className="upload-zone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input type="file" accept="image/*" ref={inputRef} onChange={handleChange} style={{ display: 'none' }} id="helmet2" />
                 {helmet.previewUrl ? (
                    <div className="preview-wrapper">
                        <img src={helmet.previewUrl} alt="Helmet preview" className="image-preview" />
                        <button className="clear-preview-button" onClick={(e) => { e.stopPropagation(); onClear(); }} title="Clear image">
                            <XCircleIcon />
                        </button>
                    </div>
                ) : (
                    <div className="upload-prompt">
                        <UploadIcon />
                        <strong>Drag & drop or click to upload</strong>
                        <p>PNG, JPG, WEBP</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export const DecalPromptBuilder = ({
  prompt, onPromptChange, onTranslate, activeLang
}: { prompt: string; onPromptChange: (newPrompt: string) => void; onTranslate: () => void; activeLang: 'vi' | 'en' }) => {
  const handleCopy = () => navigator.clipboard.writeText(prompt);
  const highlighterRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleScroll = () => {
      if (highlighterRef.current && textareaRef.current) {
          highlighterRef.current.scrollTop = textareaRef.current.scrollTop;
          highlighterRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
  };

  const renderHighlightedText = useMemo(() => {
    if (!prompt) return '';
    const regex = /(\[(?:Decal Theme|Motifs|Pattern Flow|Palette HEX|Density|Finish Cues|Typography|Mood\/Style Adjectives|Constraints|Chủ đề decal|Mô-típ|Dòng chảy họa tiết|Bảng màu HEX|Mật độ|Hiệu ứng bề mặt|Chữ|Tính cách|Ràng buộc)\]:)/g;
    const parts = prompt.split(regex);
    return parts.map((part, index) => {
      if (index % 2 === 1) { // Matched parts are at odd indices
        return <strong key={index}>{part}</strong>;
      }
      return part;
    });
  }, [prompt]);

  return (
    <div className="prompt-builder">
      <h2>3. Decal Prompt</h2>
      <div className="prompt-editor-wrapper">
        <div ref={highlighterRef} className="prompt-highlighter" aria-hidden="true">
            {renderHighlightedText}
            {/* Add a trailing newline to prevent layout shifts */}
            <br />
        </div>
        <textarea
          ref={textareaRef}
          className="prompt-editor-textarea"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onScroll={handleScroll}
          aria-label="Decal Prompt"
          spellCheck="false"
        />
      </div>
      <div className="prompt-builder-actions">
        <button className="icon-button" onClick={onTranslate} aria-label="Translate prompt">
          <TranslateIcon/> {activeLang === 'en' ? 'Dịch VI' : 'Translate EN'}
        </button>
        <button className="icon-button" onClick={handleCopy} aria-label="Copy prompt">
          <CopyIcon/> Copy
        </button>
      </div>
    </div>
  );
};

export const AdvancedOptions = ({
    preserveFinish, setPreserveFinish,
    avoidZones, setAvoidZones
}: {
    preserveFinish: boolean; setPreserveFinish: (val: boolean) => void;
    avoidZones: boolean; setAvoidZones: (val: boolean) => void;
}) => (
    <div className="advanced-options">
        <h2>Advanced Options</h2>
        <div className="option">
            <span>Preserve Finish (gloss/matte)</span>
             <label className="toggle-switch">
                <input type="checkbox" checked={preserveFinish} onChange={e => setPreserveFinish(e.target.checked)} />
                <span className="slider"></span>
            </label>
        </div>
        <div className="option">
            <span>Avoid Zones (visor/vents)</span>
             <label className="toggle-switch">
                <input type="checkbox" checked={avoidZones} onChange={e => setAvoidZones(e.target.checked)} />
                <span className="slider"></span>
            </label>
        </div>
    </div>
);

export const PanelView = ({ title, onBack, children }: { title: string; onBack?: () => void; children: React.ReactNode }) => (
    <div className="panel-view">
        <div className="panel-view-header">
            {onBack && (
                <button onClick={onBack} className="panel-back-button" title="Back">
                    <BackIcon />
                </button>
            )}
            <h3>{title}</h3>
        </div>
        {children}
    </div>
);


export const FullViewPanel = ({
    resolution, setResolution,
    angleSpread, setAngleSpread,
    lighting, setLighting,
    preserveFinish, setPreserveFinish,
    lockSeed, setLockSeed,
    onGenerate,
    isGenerating,
    hasResult
}: {
    resolution: FullViewResolution; setResolution: (r: FullViewResolution) => void;
    angleSpread: FullViewAngleSpread; setAngleSpread: (a: FullViewAngleSpread) => void;
    lighting: boolean; setLighting: (l: boolean) => void;
    preserveFinish: boolean; setPreserveFinish: (p: boolean) => void;
    lockSeed: boolean; setLockSeed: (l: boolean) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    hasResult: boolean;
}) => {
    return (
        <>
            <div className="panel-controls">
                <div className="option">
                    <label>Resolution</label>
                    <div className="button-group">
                        <button className={resolution === 1024 ? 'active' : ''} onClick={() => setResolution(1024)}>1024</button>
                        <button className={resolution === 2048 ? 'active' : ''} onClick={() => setResolution(2048)}>2048</button>
                        <button className={resolution === 4096 ? 'active' : ''} onClick={() => setResolution(4096)}>4096</button>
                    </div>
                </div>
                <div className="option">
                    <label>Angle Spread</label>
                     <div className="button-group">
                        <button className={angleSpread === 'narrow' ? 'active' : ''} onClick={() => setAngleSpread('narrow')}>Narrow (±30°)</button>
                        <button className={angleSpread === 'standard' ? 'active' : ''} onClick={() => setAngleSpread('standard')}>Standard (±40°)</button>
                        <button className={angleSpread === 'wide' ? 'active' : ''} onClick={() => setAngleSpread('wide')}>Wide (±60°)</button>
                    </div>
                </div>
                 <div className="option">
                    <label>Lighting Consistency</label>
                     <label className="toggle-switch">
                        <input type="checkbox" checked={lighting} onChange={e => setLighting(e.target.checked)} />
                        <span className="slider"></span>
                    </label>
                </div>
                 <div className="option">
                    <label>Preserve Finish</label>
                     <label className="toggle-switch">
                        <input type="checkbox" checked={preserveFinish} onChange={e => setPreserveFinish(e.target.checked)} />
                        <span className="slider"></span>
                    </label>
                </div>
                 <div className="option">
                    <label>Lock Seed</label>
                     <label className="toggle-switch">
                        <input type="checkbox" checked={lockSeed} onChange={e => setLockSeed(e.target.checked)} />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>
            <div className="panel-actions">
                 <button className="cta-button" onClick={onGenerate} disabled={isGenerating}>
                    {hasResult ? 'Regenerate' : 'Generate Full View'}
                 </button>
            </div>
        </>
    );
};


export const StylePackView = ({
    styleId, onStyleIdChange,
    strength, onStrengthChange,
    preserveFinish, onPreserveFinishChange,
    lockSeed, onLockSeedChange,
    onApplyOrReload,
    isCached,
    isStyling
}: {
    styleId: StyleId; onStyleIdChange: (id: StyleId) => void;
    strength: number; onStrengthChange: (val: number) => void;
    preserveFinish: boolean; onPreserveFinishChange: (val: boolean) => void;
    lockSeed: boolean; onLockSeedChange: (val: boolean) => void;
    onApplyOrReload: () => void;
    isCached: boolean;
    isStyling: boolean;
}) => {
  const styles = {
    'line-sketch': 'Line Sketch',
    'watercolor': 'Watercolor',
    'marker': 'Marker Illustration',
    'neon': 'Neon / Cyberpunk',
  };

  return (
    <>
      <div className="style-selector">
        {Object.entries(styles).map(([id, name]) => (
          <button
            key={id}
            className={`style-button ${styleId === id ? 'active' : ''}`}
            onClick={() => onStyleIdChange(id as StyleId)}
            disabled={isStyling}
          >
            <div className={`style-thumbnail ${id}`}></div>
            <span>{name}</span>
          </button>
        ))}
      </div>
      <div className="panel-controls style-controls">
        <div className="option">
            <label htmlFor="strength">Style strength: {strength}</label>
            <input id="strength" type="range" min="0" max="100" value={strength} onChange={(e) => onStrengthChange(Number(e.target.value))} disabled={isStyling}/>
        </div>
        <div className="option">
            <label>Preserve original finish</label>
             <label className="toggle-switch">
                <input type="checkbox" checked={preserveFinish} onChange={(e) => onPreserveFinishChange(e.target.checked)} disabled={isStyling}/>
                <span className="slider"></span>
            </label>
        </div>
        <div className="option">
            <label>Stable result (lock seed)</label>
             <label className="toggle-switch">
                <input type="checkbox" checked={lockSeed} onChange={(e) => onLockSeedChange(e.target.checked)} disabled={isStyling}/>
                <span className="slider"></span>
            </label>
        </div>
      </div>
       <div className="panel-actions style-pack-actions">
        <button className="cta-button" onClick={onApplyOrReload} disabled={isStyling}>
          {isCached ? 'Reload Style' : 'Apply Style'}
        </button>
      </div>
    </>
  )
};

export const ResultsDisplay = ({
    result,
    isLoading,
    loadingText,
    onStartOver,
    activeTab,
    setActiveTab,
    // Download Handlers
    onDownloadSingleView,
    onDownloadFullViewGrid,
    onDownloadStylePack,
    // Full View
    fullViewResult,
    isGeneratingFullView,
    fullViewResolution, setFullViewResolution,
    fullViewAngleSpread, setFullViewAngleSpread,
    fullViewLighting, setFullViewLighting,
    fullViewPreserveFinish, setFullViewPreserveFinish,
    fullViewLockSeed, setFullViewLockSeed,
    onGenerateFullView,
    // Style Pack
    stylePackResult,
    isStyling,
    styleId, onStyleIdChange,
    strength, onStrengthChange,
    preserveFinish, onPreserveFinishChange,
    lockSeed, onLockSeedChange,
    onApplyOrReload,
    isCached
}: {
    result: string | null;
    isLoading: boolean;
    loadingText: string;
    onStartOver: () => void;
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    // Download Handlers
    onDownloadSingleView: () => void;
    onDownloadFullViewGrid: () => void;
    onDownloadStylePack: () => void;
     // Full View
    fullViewResult: FullViewResult;
    isGeneratingFullView: boolean;
    fullViewResolution: FullViewResolution; setFullViewResolution: (r: FullViewResolution) => void;
    fullViewAngleSpread: FullViewAngleSpread; setFullViewAngleSpread: (a: FullViewAngleSpread) => void;
    fullViewLighting: boolean; setFullViewLighting: (l: boolean) => void;
    fullViewPreserveFinish: boolean; setFullViewPreserveFinish: (p: boolean) => void;
    fullViewLockSeed: boolean; setFullViewLockSeed: (l: boolean) => void;
    onGenerateFullView: () => void;
    // Style Pack
    stylePackResult: string | null;
    isStyling: boolean;
    styleId: StyleId; onStyleIdChange: (id: StyleId) => void;
    strength: number; onStrengthChange: (val: number) => void;
    preserveFinish: boolean; onPreserveFinishChange: (val: boolean) => void;
    lockSeed: boolean; onLockSeedChange: (val: boolean) => void;
    onApplyOrReload: () => void;
    isCached: boolean;
}) => {
  return (
    <div className="results-panel">
      <h2>4. Result</h2>
      <div className="results-tabs">
        <button className={`tab-button ${activeTab === 'single' ? 'active' : ''}`} onClick={() => setActiveTab('single')}>Single View</button>
        <button
            className={`tab-button ${activeTab === 'full-view' ? 'active' : ''}`}
            onClick={() => setActiveTab('full-view')}
            disabled={!result}
            title={!result ? 'Generate a Single View first' : ''}
        >
            Full View
        </button>
        <button
            className={`tab-button ${activeTab === 'style' ? 'active' : ''}`}
            onClick={() => setActiveTab('style')}
            disabled={!result}
            title={!result ? 'Generate a Single View first' : ''}
        >
            Style Pack
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'single' && (
            isLoading ? <Spinner text={loadingText} /> :
            result ? (
                <>
                    <div className="result-image-wrapper"><img src={result} alt="Generated helmet" className="result-image" /></div>
                    <div className="result-actions">
                        <button className="download-button" onClick={onDownloadSingleView}>Download</button>
                    </div>
                </>
            ) : (
                <p className="placeholder-text">The result will be displayed here</p>
            )
        )}
        
        {activeTab === 'full-view' && (
            isGeneratingFullView ? <Spinner text={loadingText} /> :
            fullViewResult ? (
                <>
                    <div className="result-image-wrapper"><img src={fullViewResult} alt="Full view grid" className="result-image" /></div>
                    <div className="result-actions">
                         <button className="download-button" onClick={onDownloadFullViewGrid} disabled={!fullViewResult}>Download Grid</button>
                    </div>
                </>
            ) : (
                 <p className="placeholder-text">This is an experimental feature, and results may be inconsistent or unexpected. I will be updating it continuously to improve performance.</p>
            )
        )}

        {activeTab === 'style' && (
            isStyling ? <Spinner text={loadingText} /> :
             stylePackResult ? (
                <>
                    <div className="result-image-wrapper"><img src={stylePackResult} alt="Styled helmet result" className="result-image" /></div>
                    <div className="result-actions">
                        <button className="download-button" onClick={onDownloadStylePack}>Download</button>
                    </div>
                </>
             ) : (
                <p className="placeholder-text">Choose a style and apply</p>
             )
        )}
      </div>

       {activeTab === 'full-view' && result && (
           <PanelView title="Full View Controls">
                <FullViewPanel
                    resolution={fullViewResolution}
                    setResolution={setFullViewResolution}
                    angleSpread={fullViewAngleSpread}
                    setAngleSpread={setFullViewAngleSpread}
                    lighting={fullViewLighting}
                    setLighting={setFullViewLighting}
                    preserveFinish={fullViewPreserveFinish}
                    setPreserveFinish={setFullViewPreserveFinish}
                    lockSeed={fullViewLockSeed}
                    setLockSeed={setFullViewLockSeed}
                    onGenerate={onGenerateFullView}
                    isGenerating={isGeneratingFullView}
                    hasResult={!!fullViewResult}
                />
            </PanelView>
       )}

       {activeTab === 'style' && result && (
            <PanelView title="Style Pack Controls" onBack={() => setActiveTab('single')}>
                <StylePackView
                    styleId={styleId} onStyleIdChange={onStyleIdChange}
                    strength={strength} onStrengthChange={onStrengthChange}
                    preserveFinish={preserveFinish} onPreserveFinishChange={onPreserveFinishChange}
                    lockSeed={lockSeed} onLockSeedChange={onLockSeedChange}
                    onApplyOrReload={onApplyOrReload}
                    isCached={isCached}
                    isStyling={isStyling}
                />
            </PanelView>
       )}

       <div className="results-toolbar">
         <button className="icon-button" onClick={onStartOver}>Start Over</button>
      </div>
    </div>
  );
};
