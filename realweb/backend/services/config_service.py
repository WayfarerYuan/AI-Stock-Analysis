import os
import re
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

_ENV_PATH = os.getenv("ENV_FILE", ".env")

_STOCK_LIST_RE = re.compile(
    r"^(?P<prefix>\s*STOCK_LIST\s*=\s*)(?P<value>.*?)(?P<suffix>\s*)$"
)

class ConfigService:
    """
    Configuration Management Service
    
    Responsibilities:
    1. Read/Write .env file
    2. Manage STOCK_LIST
    """
    
    def __init__(self, env_path: Optional[str] = None):
        self.env_path = env_path or _ENV_PATH
    
    def read_env_text(self) -> str:
        """Read .env file content"""
        try:
            with open(self.env_path, "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            return ""
    
    def write_env_text(self, text: str) -> None:
        """Write content to .env file"""
        with open(self.env_path, "w", encoding="utf-8") as f:
            f.write(text)
    
    def get_stock_list(self) -> List[str]:
        """Get current stock list as a list of strings"""
        env_text = self.read_env_text()
        raw_list = self._extract_stock_list(env_text)
        if not raw_list:
            return []
        return [s.strip() for s in raw_list.split(",") if s.strip()]
    
    def add_stock_to_list(self, code: str) -> List[str]:
        """Add a stock code to the list (deduplicated)"""
        current_list = self.get_stock_list()
        if code in current_list:
            return current_list
        
        current_list.append(code)
        self._save_stock_list(current_list)
        return current_list

    def remove_stock_from_list(self, code: str) -> List[str]:
        """Remove a stock code from the list"""
        current_list = self.get_stock_list()
        if code not in current_list:
            return current_list
        
        new_list = [c for c in current_list if c != code]
        self._save_stock_list(new_list)
        return new_list

    def _save_stock_list(self, stock_list: List[str]) -> None:
        """Save list back to .env"""
        stock_str = ",".join(stock_list)
        env_text = self.read_env_text()
        updated_text = self._update_stock_list(env_text, stock_str)
        self.write_env_text(updated_text)

    def _extract_stock_list(self, env_text: str) -> str:
        """Extract STOCK_LIST value from env text"""
        for line in env_text.splitlines():
            m = _STOCK_LIST_RE.match(line)
            if m:
                raw = m.group("value").strip()
                # Remove quotes
                if (raw.startswith('"') and raw.endswith('"')) or \
                   (raw.startswith("'") and raw.endswith("'")):
                    raw = raw[1:-1]
                return raw
        return ""
    
    def _update_stock_list(self, env_text: str, new_value: str) -> str:
        """Update STOCK_LIST in env text"""
        lines = env_text.splitlines(keepends=False)
        out_lines: List[str] = []
        replaced = False
        
        for line in lines:
            m = _STOCK_LIST_RE.match(line)
            if not m:
                out_lines.append(line)
                continue
            
            out_lines.append(f"{m.group('prefix')}{new_value}{m.group('suffix')}")
            replaced = True
        
        if not replaced:
            if out_lines and out_lines[-1].strip() != "":
                out_lines.append("")
            out_lines.append(f"STOCK_LIST={new_value}")
        
        # Restore trailing newline if original had one or if it was empty
        trailing_newline = env_text.endswith("\n") if env_text else True
        out = "\n".join(out_lines)
        return out + ("\n" if trailing_newline else "")
