import asyncio
import os
import json
from datetime import datetime
from app.services.claude_service import analyze_with_claude
from app.services.deepseek_service import analyze_with_deepseek

async def main():
    import sys
    
    # Get script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Get input file path from command line arguments
    if len(sys.argv) < 2:
        raise ValueError("Usage: python analyze_dna.py <input_file>")
        
    input_file = sys.argv[1]
    if not os.path.exists(input_file):
        raise ValueError(f"Input file not found: {input_file}")
    
    # Read DNA sequence from input file
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract DNA sequence (only ATCG characters)
    dna_sequence = ''.join([c for c in content if c in 'ATCG'])
    
    if not dna_sequence:
        print("Warning: No valid DNA sequence found, using test sequence")
        dna_sequence = "ATCG" * 10  # Use test sequence for demonstration
    
    print(f"Processing sequence of length: {len(dna_sequence)}")
    
    results = {
        'timestamp': datetime.now().isoformat(),
        'sequence_length': len(dna_sequence),
        'analyses': {}
    }
    
    try:
        # Run both analyses concurrently
        analysis_tasks = [
            analyze_with_claude(dna_sequence),
            analyze_with_deepseek(dna_sequence)
        ]
        
        analysis_results = await asyncio.gather(*analysis_tasks, return_exceptions=True)
        claude_result, deepseek_result = analysis_results
        
        # Process Claude results
        if isinstance(claude_result, dict):
            results['analyses']['claude'] = claude_result
            print("\n=== Claude Analysis ===")
            print(json.dumps(claude_result, indent=2, ensure_ascii=False))
        else:
            error_msg = str(claude_result) if isinstance(claude_result, Exception) else "Unknown error"
            print(f"\nError in Claude analysis: {error_msg}")
            results['analyses']['claude'] = {'error': error_msg}
        
        # Process DeepSeek results
        if isinstance(deepseek_result, dict):
            results['analyses']['deepseek'] = deepseek_result
            print("\n=== DeepSeek Analysis ===")
            print(json.dumps(deepseek_result, indent=2, ensure_ascii=False))
        else:
            error_msg = str(deepseek_result) if isinstance(deepseek_result, Exception) else "Unknown error"
            print(f"\nError in DeepSeek analysis: {error_msg}")
            results['analyses']['deepseek'] = {'error': error_msg}
        
        # Save results to a file
        results_path = os.path.join(script_dir, 'analysis_results.json')
        with open(results_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\nResults saved to {results_path}")
        
    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
