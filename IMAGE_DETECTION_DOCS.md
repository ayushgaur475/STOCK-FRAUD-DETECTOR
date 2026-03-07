# Image Pattern Detection Feature

## Overview
Added comprehensive image pattern detection to identify fake profit screenshots, manipulated charts, and fraudulent trading app interfaces using advanced computer vision techniques.

## What It Detects

### 1. **Edited Profit Screenshots**
- **Compression Artifacts**: Detects heavy JPEG compression common in edited images using Laplacian variance
- **Color Channel Inconsistencies**: Analyzes RGB channel distributions for unusual patterns
- **Edge Tampering**: Uses Canny edge detection to identify removed or added content
- **Metadata Anomalies**: Checks for missing or suspicious EXIF data

### 2. **Fake Trading App Interfaces**
- **Fake Buttons**: Detects randomly placed circular elements using Hough Circle Transform
- **Inconsistent UI Elements**: Identifies excessive rectangular UI shapes using Hough Line Transform
- **Suspicious Text Rendering**: Analyzes text region density and distribution
- **Fake Notifications**: Detects visually inconsistent notification elements

### 3. **Manipulated Charts**
- **Chart Artifacting**: Detects overly smooth lines that don't match real trade data
- **Line Anomalies**: Analyzes contour complexity to identify interpolated/fake data
- **Grid Inconsistencies**: Detects missing or malformed chart grid structures
- **Scale Tampering**: Identifies unusual axis scaling that exaggerates profits

### 4. **General Image Inconsistencies**
- **Lighting Inconsistencies**: Detects regions with different brightness levels (sign of compositing)
- **Shadow Anomalies**: Identifies unnatural shadow placement and darkness
- **Blending Artifacts**: Analyzes edge density to detect poorly blended images

## Architecture

### Backend Components

#### `image_analyzer.py`
```python
class ImagePatternDetector:
    - analyze_image(image_data)        # Main analysis function
    - _detect_image_manipulation()     # Edits & compression
    - _detect_fake_interface()          # App interfaces
    - _detect_chart_manipulation()      # Chart tampering
    - _detect_inconsistencies()         # Lighting, shadows
    - _calculate_risk_score()           # Overall scoring
    - get_suspicious_details()          # Formatted results
```

#### FastAPI Endpoint
```
POST /analyze-image
- Accepts multipart/form-data with image file
- Returns detailed analysis with risk score
- Risk levels: HIGH (>70%), MEDIUM (40-70%), LOW (<40%)
```

### Frontend Components

#### Image Upload Section
- Drag-and-drop file upload area
- Image preview with analysis button
- Displays results with detailed findings

#### Analysis Results Display
- Risk score and level indicator (HIGH/MEDIUM/LOW)
- Categorized suspicious findings (4 categories)
- Confidence scores for each detection
- Visual progress bars for confidence levels

## Computer Vision Techniques Used

1. **Canny Edge Detection** - Detect image boundaries and structures
2. **Hough Line Transform** - Identify straight lines (chart grids)
3. **Hough Circle Transform** - Detect circular elements (fake buttons)
4. **Contour Analysis** - Identify shapes and their properties
5. **Histogram Comparison** - Analyze color channel distributions
6. **Laplacian Variance** - Detect image sharpness and compression
7. **Region-based Analysis** - Analyze different image sections

## API Response Format

```json
{
  "file_name": "screenshot.png",
  "image_risk_score": 85.5,
  "is_suspicious": true,
  "risk_level": "HIGH",
  "detected_manipulations": {
    "editing_artifacts": { ... },
    "fake_interface": { ... },
    "chart_tampering": { ... },
    "inconsistencies": { ... }
  },
  "suspicious_findings": [
    {
      "category": "Manipulation Detected",
      "issue": "Heavy compression detected - possible editing",
      "confidence": 0.7
    },
    ...
  ],
  "summary": {
    "total_issues_found": 5,
    "highest_risk_category": "Chart Tampering Detected"
  }
}
```

## Usage

### For Users
1. Navigate to "Detect Fake Profit Screenshots" section
2. Click "Select Image" or drag-drop an image
3. Click "Analyze Image"
4. Review detailed findings and risk score

### For Developers
```python
from image_analyzer import ImagePatternDetector

detector = ImagePatternDetector()
results = detector.analyze_image(image_bytes)

# Results contain:
# - overall_risk_score (0-1)
# - is_suspicious (boolean)
# - detected_manipulations (dict)
# - suspicious_findings (list)
```

## Risk Scoring

The overall risk score is calculated by averaging all detector confidence scores:

- **Manipulation Score**: Weight of editing artifacts (0-1)
- **Fake Interface Score**: Weight of UI inconsistencies (0-1)
- **Chart Tampering Score**: Weight of chart anomalies (0-1)
- **Inconsistency Score**: Weight of lighting/shadow issues (0-1)

**Final Score** = Average of all detector scores × 100

## Dependencies Added

- `opencv-python` - Computer vision library
- `pillow` - Image processing
- `python-multipart` - File upload support

## Frontend Changes

### New UI Components
- Image upload area with drag-drop support
- Image preview section
- Analyze button with loading state
- Results display with categorized findings
- Confidence visualization bars

### New CSS Classes
- `.image-analysis-section` - Main container
- `.upload-area` - Upload zone
- `.image-preview-section` - Preview area
- `.image-results-container` - Results display
- `.finding-item` - Individual finding card
- `.confidence-bar` - Confidence visualization

## Performance Notes

- Image analysis typically takes 2-5 seconds depending on image size
- Large images (>10MB) are automatically resized
- Results are cached in memory for the session
- Computer vision operations are optimized for real-time performance

## Security Considerations

- File uploads limited to image types only
- Maximum file size validation (recommended: 10MB)
- No image data stored on server permanently
- All processing done locally without external APIs
- EXIF data handling prevents file path leaks

## Future Enhancements

1. **Machine Learning Integration**
   - Train neural networks on manipulated vs real images
   - Use transfer learning from pre-trained image classifiers
   - Implement deepfake detection

2. **Advanced Analysis**
   - Metadata verification using PIL
   - Digital signature analysis
   - Reverse image search integration
   - Blockchain-based image verification

3. **UI Improvements**
   - Batch image upload
   - Comparison analysis (upload before/after)
   - Image history tracking
   - Report generation and export

4. **Integration**
   - Connect with stock ticker analysis
   - Flag suspicious screenshots during stock mentions
   - Automatic comparison with legitimate app screenshots

## Troubleshooting

### Image Analysis Fails
- Ensure image is valid format (JPG, PNG, GIF, BMP)
- Check if image file size is reasonable (<10MB)
- Try converting image to PNG format

### High False Positives
- Legitimate screenshots with heavy compression may flag
- Very filtered images might trigger inconsistency detection
- Stock charts with unusual colors can trigger false alarms

### Performance Issues
- Large images (>5MB) take longer to process
- Consider resizing images before upload
- Analysis time varies with image complexity

## Testing the Feature

```bash
# 1. Start backend
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000

# 2. Start frontend
cd frontend-new
npm run dev

# 3. Navigate to http://localhost:5174/
# 4. Scroll to "Detect Fake Profit Screenshots"
# 5. Upload a test image and analyze
```

---

**Image Pattern Detection v1.0** - Protecting users from investment fraud through advanced computer vision analysis.
