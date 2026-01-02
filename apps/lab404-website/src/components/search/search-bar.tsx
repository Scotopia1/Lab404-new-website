'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAutocomplete, AutocompleteSuggestion } from '@/hooks/use-search';
import { cn } from '@/lib/utils';

interface SearchBarProps {
    className?: string;
    placeholder?: string;
    onSearch?: (query: string) => void;
}

export function SearchBar({ className, placeholder = 'Search products...', onSearch }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Debounce the query for autocomplete
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 200);
        return () => clearTimeout(timer);
    }, [query]);

    const { data: autocompleteData, isLoading } = useAutocomplete(debouncedQuery, 6, {
        enabled: debouncedQuery.length >= 2,
    });

    const suggestions = autocompleteData?.suggestions || [];

    // Handle search submission
    const handleSearch = useCallback((searchQuery: string) => {
        if (searchQuery.trim()) {
            setIsOpen(false);
            setQuery('');
            if (onSearch) {
                onSearch(searchQuery);
            } else {
                router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
            }
        }
    }, [onSearch, router]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(query);
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: AutocompleteSuggestion) => {
        setIsOpen(false);
        setQuery('');
        router.push(`/products/${suggestion.slug}`);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    handleSuggestionClick(suggestions[selectedIndex]);
                } else {
                    handleSearch(query);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Open dropdown when typing
    useEffect(() => {
        if (query.length >= 2) {
            setIsOpen(true);
            setSelectedIndex(-1);
        } else {
            setIsOpen(false);
        }
    }, [query]);

    return (
        <div className={cn('relative', className)}>
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => query.length >= 2 && setIsOpen(true)}
                        className="pl-9 pr-9 w-[200px] lg:w-[300px] bg-muted/50 border-0 focus-visible:bg-background focus-visible:ring-2"
                        autoComplete="off"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('');
                                setIsOpen(false);
                                inputRef.current?.focus();
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </form>

            {/* Autocomplete Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 overflow-hidden"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : suggestions.length > 0 ? (
                        <ul className="py-2">
                            {suggestions.map((suggestion, index) => (
                                <li key={suggestion.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className={cn(
                                            'w-full px-4 py-2 flex items-center gap-3 hover:bg-muted transition-colors text-left',
                                            selectedIndex === index && 'bg-muted'
                                        )}
                                    >
                                        <div className="w-10 h-10 relative flex-shrink-0 bg-muted rounded overflow-hidden">
                                            {suggestion.thumbnailUrl ? (
                                                <Image
                                                    src={suggestion.thumbnailUrl}
                                                    alt={suggestion.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    <Search className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{suggestion.name}</p>
                                            {suggestion.categoryName && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {suggestion.categoryName}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-sm font-semibold">
                                            ${suggestion.basePrice.toFixed(2)}
                                        </span>
                                    </button>
                                </li>
                            ))}
                            {/* Search all link */}
                            <li className="border-t mt-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleSearch(query)}
                                    className="w-full px-4 py-2 text-sm text-primary hover:bg-muted transition-colors text-left flex items-center gap-2"
                                >
                                    <Search className="h-4 w-4" />
                                    Search all products for &ldquo;{query}&rdquo;
                                </button>
                            </li>
                        </ul>
                    ) : query.length >= 2 ? (
                        <div className="px-4 py-4 text-center">
                            <p className="text-sm text-muted-foreground">No products found</p>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => handleSearch(query)}
                                className="mt-1"
                            >
                                Search all products
                            </Button>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
