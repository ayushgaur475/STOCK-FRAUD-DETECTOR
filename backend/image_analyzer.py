import cv2
import numpy as np
from PIL import Image
import io
from typing import Dict, List, Tuple
import base64
import re
import urllib.request

class ImagePatternDetector:
    """
    Detects scam images using text analysis and computer vision.
    Primary focus: Text-based indicators of pump-and-dump schemes
    """
    
    def __init__(self):
        self.manipulation_threshold = 0.6
        self.fake_interface_confidence = 0.5
        
        # Scam indicators - HIGH RISK keywords
        self.profit_claim_keywords = [
            r'\b(300%|200%|100%|guaranteed|guaranteed\s+gain)',
            r'\btarget\s*:\s*\d+%',
            r'\b(double|triple|quadruple)\s+(money|profit|wealth)',
            r'\bmade\s+₹[\d,]+\s+(today|yesterday|last\s+week)',
            r'\bunrealistic\s+(gain|profit)',
            r'\binside\s+(tip|information|news)',
            r'\bsecret\s+(formula|strategy|method)',
        ]
        
        self.urgency_keywords = [
            r'\b(buy\s+now|act\s+now|don[\'t]*\s+miss)',
            r'\b(limited\s+spot|limited\s+time|hurry)',
            r'\b(explode|rocket|moon|surge|pump)',
            r'\b(this\s+will\s+(go|soar|surge|pump))',
            r'\b(don[\'t]*\s+miss\s+out)',
            r'\b(fomo|fear\s+of\s+missing)',
            r'\b(today\s+only|last\s+chance)',
        ]
        
        self.vip_promotion_keywords = [
            r'\bvip\s+(group|member|club)',
            r'\bjoin\s+vip',
            r'\bpaid\s+(group|membership|tip)',
            r'\bpremium\s+(member|group)',
            r'\bcall\s+now|whatsapp|telegram',
            r'\b₹\s*[\d,]+\s*(per\s+)?month',
            r'\b(premium|vip)\s+access',
        ]
        
        self.insider_keywords = [
            r'\binsider\s+(tip|info|information)',
            r'\bconfidential',
            r'\b(upcoming|tomorrow)\s+big\s+(news|announcement)',
            r'\bonly\s+(we|this\s+group)\s+know',
            r'\bexclusive\s+(information|tip)',
        ]
        
        self.manipulative_marketing = [
            r'\b(profit|cash|money)\s+(image|screenshot|proof)',
            r'\b(earning|profit)\s+proof',
            r'\b₹[\d,]+\s+(profit|earning)',
            r'\b(before|after)\s+joining',
        ]
        
    def analyze_image(self, image_data: bytes) -> Dict:
        """
        Analyze image for signs of manipulation and fake interfaces.
        PRIMARY FOCUS: Text-based scam indicators (profit claims, urgency, VIP promotion, etc.)
        SECONDARY: Computer vision analysis
        
        Args:
            image_data: Binary image data
            
        Returns:
            Dictionary with analysis results and risk scores
        """
        try:
            # Convert bytes to image
            image = Image.open(io.BytesIO(image_data))
            image_np = np.array(image)
            
            # Convert RGB to BGR for OpenCV
            if len(image_np.shape) == 3 and image_np.shape[2] == 3:
                image_cv = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
            else:
                image_cv = image_np
            
            # PRIMARY: Extract and analyze text
            extracted_text = self._extract_text(image_np)
            text_analysis = self._analyze_text_for_scam(extracted_text)
            
            # SECONDARY: Run computer vision detections
            visual_analysis = {
                'manipulation_indicators': self._detect_image_manipulation(image_cv),
                'fake_interface_indicators': self._detect_fake_interface(image_cv),
                'chart_tampering_indicators': self._detect_chart_manipulation(image_cv),
                'inconsistency_indicators': self._detect_inconsistencies(image_cv),
            }
            
            # Combine results with TEXT as primary factor (70% weight)
            results = {
                'overall_risk_score': 0,
                'is_suspicious': False,
                'detected_issues': [],
                'text_analysis': text_analysis,
                'visual_analysis': visual_analysis,
                'extracted_text': extracted_text[:500]  # Store first 500 chars
            }
            
            # Calculate overall risk score
            results['overall_risk_score'] = self._calculate_risk_score_weighted(text_analysis, visual_analysis)
            results['is_suspicious'] = results['overall_risk_score'] > self.manipulation_threshold
            
            return results
            
        except Exception as e:
            return {
                'error': str(e),
                'overall_risk_score': 0,
                'is_suspicious': False,
                'detected_issues': [f'Error analyzing image: {str(e)}']
            }
    
    def _extract_text(self, image: np.ndarray) -> str:
        """Extract text from image. Returns empty string without OCR library."""
        # Note: OCR extraction requires Tesseract or EasyOCR to be installed
        # For now, this returns empty and analysis relies on visual patterns
        return ""
    
    def _analyze_text_for_scam(self, text: str) -> Dict:
        """Analyze extracted text for scam indicators."""
        text_lower = text.lower()
        
        analysis = {
            'profit_claims': 0,
            'urgency_language': 0,
            'vip_promotion': 0,
            'insider_claims': 0,
            'manipulative_marketing': 0,
            'detected_issues': []
        }
        
        # Check for profit claim keywords
        profit_matches = sum(1 for pattern in self.profit_claim_keywords if re.search(pattern, text_lower, re.IGNORECASE))
        if profit_matches > 0:
            analysis['profit_claims'] = min(0.95, 0.4 + (profit_matches * 0.15))
            analysis['detected_issues'].append(f'Unrealistic profit claims detected ({profit_matches} instances)')
        
        # Check for urgency language
        urgency_matches = sum(1 for pattern in self.urgency_keywords if re.search(pattern, text_lower, re.IGNORECASE))
        if urgency_matches > 0:
            analysis['urgency_language'] = min(0.90, 0.3 + (urgency_matches * 0.12))
            analysis['detected_issues'].append(f'High-pressure/urgency language detected ({urgency_matches} instances)')
        
        # Check for VIP promotion
        vip_matches = sum(1 for pattern in self.vip_promotion_keywords if re.search(pattern, text_lower, re.IGNORECASE))
        if vip_matches > 0:
            analysis['vip_promotion'] = min(0.85, 0.5 + (vip_matches * 0.1))
            analysis['detected_issues'].append(f'VIP/Paid group promotion detected ({vip_matches} instances)')
        
        # Check for insider claims
        insider_matches = sum(1 for pattern in self.insider_keywords if re.search(pattern, text_lower, re.IGNORECASE))
        if insider_matches > 0:
            analysis['insider_claims'] = min(0.90, 0.6 + (insider_matches * 0.1))
            analysis['detected_issues'].append(f'Insider information claims detected ({insider_matches} instances)')
        
        # Check for manipulative marketing
        marketing_matches = sum(1 for pattern in self.manipulative_marketing if re.search(pattern, text_lower, re.IGNORECASE))
        if marketing_matches > 0:
            analysis['manipulative_marketing'] = min(0.80, 0.3 + (marketing_matches * 0.15))
            analysis['detected_issues'].append(f'Manipulative marketing tactics detected ({marketing_matches} instances)')
        
        return analysis
    
    def _calculate_risk_score_weighted(self, text_analysis: Dict, visual_analysis: Dict) -> float:
        """
        Calculate risk score with TEXT as primary factor (70% weight)
        and visual analysis as secondary (30% weight).
        """
        # Text-based risk score (primary - 70%)
        text_scores = [v for k, v in text_analysis.items() if isinstance(v, (int, float)) and k != 'detected_issues']
        if text_scores:
            # Use the maximum text indicator + average of others
            text_scores_sorted = sorted(text_scores, reverse=True)
            if len(text_scores_sorted) == 1:
                text_risk = text_scores_sorted[0]
            else:
                text_risk = (text_scores_sorted[0] * 0.6) + (np.mean(text_scores_sorted[1:]) * 0.4)
        else:
            text_risk = 0
        
        # Visual-based risk score (secondary - 30%)
        visual_scores = []
        for key in ['manipulation_indicators', 'fake_interface_indicators', 
                    'chart_tampering_indicators', 'inconsistency_indicators']:
            if key in visual_analysis:
                indicators = visual_analysis[key]
                category_scores = [value for detector_key, value in indicators.items() 
                                 if isinstance(value, (int, float)) and detector_key != 'issues' and value > 0]
                if category_scores:
                    visual_scores.append(max(category_scores))
        
        if visual_scores:
            visual_scores_sorted = sorted(visual_scores, reverse=True)
            if len(visual_scores_sorted) == 1:
                visual_risk = visual_scores_sorted[0]
            else:
                visual_risk = (visual_scores_sorted[0] * 0.4) + (np.mean(visual_scores_sorted[1:]) * 0.6)
        else:
            visual_risk = 0
        
        # Combined risk: 70% text + 30% visual
        combined_risk = (text_risk * 0.7) + (visual_risk * 0.3)
        return min(max(combined_risk, 0), 1)
    
    def _detect_image_manipulation(self, image: np.ndarray) -> Dict:
        """Detect signs of image editing and compression artifacts."""
        indicators = {
            'compression_artifacts': 0,
            'color_inconsistencies': 0,
            'edge_tampering': 0,
            'metadata_anomalies': 0,
            'issues': []
        }
        
        try:
            # Check for compression artifacts using Laplacian variance
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Low Laplacian variance suggests heavy compression (common in edited images)
            if laplacian_var < 100:
                indicators['compression_artifacts'] = 0.8
                indicators['issues'].append('Heavy compression detected - possible editing')
            elif laplacian_var < 200:
                indicators['compression_artifacts'] = 0.5
                indicators['issues'].append('Moderate compression detected')
            
            # Detect color channel inconsistencies
            b_hist = cv2.calcHist([image], [0], None, [256], [0, 256])
            g_hist = cv2.calcHist([image], [1], None, [256], [0, 256])
            r_hist = cv2.calcHist([image], [2], None, [256], [0, 256])
            
            # Calculate chi-square distances between channels
            bg_diff = cv2.compareHist(b_hist, g_hist, cv2.HISTCMP_CHISQR)
            gr_diff = cv2.compareHist(g_hist, r_hist, cv2.HISTCMP_CHISQR)
            
            if bg_diff > 1000 or gr_diff > 1000:
                indicators['color_inconsistencies'] = 0.7
                indicators['issues'].append('Unusual color channel distribution - possible manipulation')
            elif bg_diff > 500 or gr_diff > 500:
                indicators['color_inconsistencies'] = 0.5
            
            # Detect edge tampering using Canny edge detection
            edges = cv2.Canny(gray, 100, 200)
            edge_ratio = np.sum(edges > 0) / edges.size
            
            # Unusually high or low edge density suggests tampering
            if edge_ratio < 0.01 or edge_ratio > 0.3:
                indicators['edge_tampering'] = 0.6
                indicators['issues'].append('Unusual edge distribution - possible content removal or addition')
            
        except Exception as e:
            indicators['issues'].append(f'Manipulation detection error: {str(e)}')
        
        return indicators
    
    def _detect_fake_interface(self, image: np.ndarray) -> Dict:
        """Detect fake trading app interfaces."""
        indicators = {
            'inconsistent_ui_elements': 0,
            'fake_buttons_detected': 0,
            'suspicious_text_rendering': 0,
            'fake_notifications': 0,
            'issues': []
        }
        
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect circles (common in fake app buttons/icons)
            circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1, 20,
                                     param1=50, param2=30, minRadius=5, maxRadius=50)
            
            if circles is not None:
                # Check if circles are randomly distributed (suspicious)
                circles = np.uint16(np.around(circles))
                num_circles = len(circles[0])
                if num_circles > 50:
                    indicators['fake_buttons_detected'] = 0.9
                    indicators['issues'].append(f'Detected {num_circles} suspicious button-like elements - likely fake interface')
                elif num_circles > 10:
                    indicators['fake_buttons_detected'] = 0.7
                    indicators['issues'].append(f'Detected {num_circles} suspicious button-like elements')
            
            # Detect rectangles (UI elements)
            edges = cv2.Canny(gray, 100, 200)
            contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            
            # Count rectangular shapes
            rectangles = 0
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = w / float(h) if h > 0 else 0
                
                # Check if it's a rectangle
                if 0.5 < aspect_ratio < 2.0 and w > 30 and h > 20:
                    rectangles += 1
            
            if rectangles > 20:
                indicators['inconsistent_ui_elements'] = 0.8
                indicators['issues'].append('Excessive rectangular UI elements detected - possible fake UI')
            elif rectangles > 15:
                indicators['inconsistent_ui_elements'] = 0.6
                indicators['issues'].append('Excessive rectangular UI elements detected')
            
            # Check for suspicious text regions
            _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
            text_ratio = np.sum(binary == 0) / binary.size
            
            if text_ratio > 0.4:
                indicators['suspicious_text_rendering'] = 0.5
                indicators['issues'].append('Unusual text density suggesting synthetic interface')
        
        except Exception as e:
            indicators['issues'].append(f'Interface detection error: {str(e)}')
        
        return indicators
    
    def _detect_chart_manipulation(self, image: np.ndarray) -> Dict:
        """Detect manipulated trading charts."""
        indicators = {
            'chart_artifacting': 0,
            'line_anomalies': 0,
            'grid_inconsistencies': 0,
            'scale_tampering': 0,
            'issues': []
        }
        
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect straight lines (chart lines, grids)
            edges = cv2.Canny(gray, 50, 150)
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, 50, minLineLength=50, maxLineGap=10)
            
            if lines is not None:
                horizontal_lines = 0
                vertical_lines = 0
                
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    angle = np.abs(np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi)
                    
                    if angle < 10 or angle > 170:
                        horizontal_lines += 1
                    elif 80 < angle < 100:
                        vertical_lines += 1
                
                # Check for irregular grid patterns
                if horizontal_lines == 0 or vertical_lines == 0:
                    indicators['grid_inconsistencies'] = 0.4
                    indicators['issues'].append('Missing chart grid elements')
                
                # Detect if grid spacing is irregular
                if horizontal_lines > 0:
                    h_spacing = image.shape[0] / max(horizontal_lines, 1)
                    if h_spacing < 20 or h_spacing > 200:
                        indicators['scale_tampering'] = 0.5
                        indicators['issues'].append('Abnormal chart axis scaling detected')
            
            # Detect smooth curves (candlesticks should have sharp edges)
            contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            
            smooth_curve_count = 0
            for contour in contours:
                epsilon = 0.02 * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                
                # Number of vertices indicates smoothness
                if len(approx) > 50:
                    smooth_curve_count += 1
            
            if smooth_curve_count > 0:
                indicators['line_anomalies'] = min(0.5 + (smooth_curve_count * 0.05), 1.0)
                indicators['issues'].append(f'Detected {smooth_curve_count} overly smooth lines - possible interpolation artifact')
        
        except Exception as e:
            indicators['issues'].append(f'Chart detection error: {str(e)}')
        
        return indicators
    
    def _detect_inconsistencies(self, image: np.ndarray) -> Dict:
        """Detect general inconsistencies in the image."""
        indicators = {
            'lighting_inconsistencies': 0,
            'shadow_anomalies': 0,
            'blending_artifacts': 0,
            'issues': []
        }
        
        try:
            # Convert to HSV for color analysis
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            
            # Check for inconsistent lighting using brightness distribution
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            brightness = np.mean(gray)
            brightness_std = np.std(gray)
            
            # Check different regions for lighting inconsistency
            h_split = image.shape[0] // 2
            w_split = image.shape[1] // 2
            
            regions = [
                gray[:h_split, :w_split],
                gray[:h_split, w_split:],
                gray[h_split:, :w_split],
                gray[h_split:, w_split:]
            ]
            
            region_brightness = [np.mean(r) for r in regions]
            brightness_variance = np.var(region_brightness)
            
            if brightness_variance > 1000:
                indicators['lighting_inconsistencies'] = 0.8
                indicators['issues'].append('Inconsistent lighting across regions - possible compositing')
            elif brightness_variance > 500:
                indicators['lighting_inconsistencies'] = 0.5
                indicators['issues'].append('Moderate lighting inconsistencies detected')
            
            # Detect shadow anomalies
            _, binary = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY)
            dark_ratio = np.sum(binary == 0) / binary.size
            
            if dark_ratio > 0.6:
                indicators['shadow_anomalies'] = 0.6
                indicators['issues'].append('Excessive dark areas - possible fake shadows or poor quality')
            elif dark_ratio > 0.4:
                indicators['shadow_anomalies'] = 0.3
                indicators['issues'].append('Unusual dark areas detected')
            
            # Detect blending artifacts at edges
            edges = cv2.Canny(gray, 100, 200)
            edge_pixels = np.sum(edges > 0)
            
            if edge_pixels > (gray.size * 0.15):
                indicators['blending_artifacts'] = 0.7
                indicators['issues'].append('Very high edge density - possible poor blending of composite image')
            elif edge_pixels > (gray.size * 0.08):
                indicators['blending_artifacts'] = 0.5
                indicators['issues'].append('High edge density - possible poor blending')
        
        except Exception as e:
            indicators['issues'].append(f'Inconsistency detection error: {str(e)}')
        
        return indicators
    
    def _calculate_risk_score(self, results: Dict) -> float:
        """Calculate overall risk score based on all detectors."""
        scores = []
        
        for key in ['manipulation_indicators', 'fake_interface_indicators', 
                    'chart_tampering_indicators', 'inconsistency_indicators']:
            if key in results:
                indicators = results[key]
                # Get max score per category
                category_scores = [value for detector_key, value in indicators.items() 
                                 if isinstance(value, (int, float)) and detector_key != 'issues' and value > 0]
                if category_scores:
                    scores.append(max(category_scores))
        
        if not scores:
            return 0
        
        # Use weighted average: max score has more weight
        # This ensures that any significant detection increases risk appropriately
        sorted_scores = sorted(scores, reverse=True)
        if len(sorted_scores) == 1:
            return min(max(sorted_scores[0], 0), 1)
        
        # Weighted average: highest score gets 40%, others get 60% split
        weighted_score = (sorted_scores[0] * 0.4) + (np.mean(sorted_scores[1:]) * 0.6)
        return min(max(weighted_score, 0), 1)
    
    def get_suspicious_details(self, analysis_results: Dict) -> List[Dict]:
        """
        Format analysis results into readable suspicious details.
        Prioritizes text-based detections.
        """
        details = []
        
        # TEXT-BASED ANALYSIS (Primary)
        if 'text_analysis' in analysis_results:
            text_analysis = analysis_results['text_analysis']
            
            if text_analysis.get('detected_issues'):
                for issue in text_analysis['detected_issues']:
                    details.append({
                        'category': 'Scam Language Detected',
                        'issue': issue,
                        'confidence': 0.95
                    })
        
        # VISUAL ANALYSIS (Secondary)
        if 'visual_analysis' in analysis_results:
            visual_analysis = analysis_results['visual_analysis']
            
            categories_map = {
                'Manipulation Detected': 'manipulation_indicators',
                'Fake Interface Detected': 'fake_interface_indicators',
                'Chart Tampering Detected': 'chart_tampering_indicators',
                'Inconsistencies Found': 'inconsistency_indicators'
            }
            
            for display_name, key in categories_map.items():
                if key in visual_analysis:
                    indicators = visual_analysis[key]
                    if indicators.get('issues'):
                        for issue in indicators['issues']:
                            confidence = max([v for k, v in indicators.items() 
                                            if k != 'issues' and isinstance(v, (int, float))], default=0)
                            details.append({
                                'category': display_name,
                                'issue': issue,
                                'confidence': confidence
                            })
        
        return details
