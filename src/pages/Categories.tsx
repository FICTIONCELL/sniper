import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCategories, generateId } from "@/hooks/useLocalStorage";
import { Category } from "@/types";
import { Plus, Tags, Palette } from "lucide-react";
import { CategoryForm } from "@/components/CategoryForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "@/contexts/TranslationContext";

const Categories = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateCategory = (data: Omit<Category, 'id' | 'createdAt'>) => {
    const newCategory: Category = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setCategories(prev => [...prev, newCategory]);
    setIsDialogOpen(false);
  };

  const predefinedColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#64748b', // slate
    '#78716c', // stone
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('categories')}</h1>
          <p className="text-muted-foreground">{t('manageCategories')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('newCategory')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('createCategory')}</DialogTitle>
            </DialogHeader>
            <CategoryForm onSubmit={handleCreateCategory} />
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tags className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noCategories')}</h3>
            <p className="text-muted-foreground mb-4">{t('startCreatingCategory')}</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('createCategory')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('createCategory')}</DialogTitle>
                </DialogHeader>
                <CategoryForm onSubmit={handleCreateCategory} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: category.color || '#64748b' }}
                    />
                    {category.name}
                  </CardTitle>
                </div>
                <CardDescription className="line-clamp-2">
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {t('color')}: {category.color ? category.color.toUpperCase() : t('notDefined')}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {t('createdOn')} {new Date(category.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('categoriesOverview')}</CardTitle>
            <CardDescription>
              {t('categoriesOverviewDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant="outline"
                  className="px-3 py-1"
                  style={{
                    backgroundColor: `${category.color || '#64748b'}20`,
                    borderColor: category.color || '#64748b',
                    color: category.color || '#64748b'
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: category.color || '#64748b' }}
                  />
                  {category.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Categories;