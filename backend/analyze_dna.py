import asyncio
import os
import json
from datetime import datetime
from app.services.claude_service import analyze_with_claude
from app.services.deepseek_service import analyze_with_deepseek

async def main():
    # Read the DNA sequence from datadna.txt
    script_dir = os.path.dirname(os.path.abspath(__file__))
    datadna_path = os.path.join(os.path.dirname(script_dir), 'datadna.txt')
    
    with open(datadna_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract the DNA sequence (last 4 lines that contain ATCG)
    lines = content.split('\n')
    dna_sequence = ''.join([line for line in lines if all(c in 'ATCG' for c in line)])
    
    print("Analyzing DNA sequence with Claude and DeepSeek...")
    print(f"Sequence length: {len(dna_sequence)}")
    
    results = {
        'timestamp': datetime.now().isoformat(),
        'sequence_length': len(dna_sequence),
        'analyses': {}
    }
    
    try:
        # Run both analyses concurrently
        claude_result, deepseek_result = await asyncio.gather(
            analyze_with_claude(dna_sequence),
            analyze_with_deepseek(dna_sequence),
            return_exceptions=True
        )
        
        if not isinstance(claude_result, Exception):
            results['analyses']['claude'] = claude_result
            print("\n=== Claude Analysis ===")
            print(claude_result['analysis'])
            print(f"Model used: {claude_result['model']}")
        else:
            print(f"\nError in Claude analysis: {str(claude_result)}")
            results['analyses']['claude'] = {'error': str(claude_result)}
        
        if not isinstance(deepseek_result, Exception):
            results['analyses']['deepseek'] = deepseek_result
            print("\n=== DeepSeek Analysis ===")
            print(deepseek_result['analysis'])
            print(f"Model used: {deepseek_result['model']}")
        else:
            print(f"\nError in DeepSeek analysis: {str(deepseek_result)}")
            results['analyses']['deepseek'] = {'error': str(deepseek_result)}
        
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
